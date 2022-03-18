package main

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"syscall/js"

	"github.com/Iotic-Labs/iotics-identity-go/pkg/api"
	"github.com/Iotic-Labs/iotics-identity-go/pkg/crypto"
	"github.com/Iotic-Labs/iotics-identity-go/pkg/register"
)

type IdType int

const (
	userIdType IdType = iota
	agentIdType
	twinIdType
)

type dict = map[string]interface{}

var c chan bool

// init is called even before main is called.
// This ensures that as soon as our WebAssembly module is ready in the browser,
// it runs and prints "Hello, webAssembly!" to the console. It then proceeds
// to create a new channel. The aim of this channel is to keep our Go app
// running until we tell it to abort.
func init() {
	fmt.Println("IOTICS Identity WebAssembly initialising!")
	c = make(chan bool)
}

func main() {
	// here, we are simply declaring the our function `sayHelloJS` as a global JS function. That means we can call it just like any other JS function.
	js.Global().Set("CreateDefaultSeed", js.FuncOf(CreateDefaultSeed))
	js.Global().Set("CreateAgentIdentity", js.FuncOf(CreateAgentIdentity))
	js.Global().Set("CreateUserIdentity", js.FuncOf(CreateUserIdentity))
	js.Global().Set("CreateTwinIdentity", js.FuncOf(CreateTwinIdentity))

	println("IOTICS Identity WebAssembly initialised!")

	// tells the channel we created in init() to "stop".
	<-c
}

func jsLog(s string) {
	js.Global().Get("console").Call("log", s)
}

func dictToJSON(in dict) string {
	ret, err := json.Marshal(in)
	if err != nil {
		return jsonError("unable to marshall map", err)
	}
	return string(ret)
}

func jsonError(message string, err error) string {
	return fmt.Sprintf("{ \"error\": \"%s\", \"message\": \"%s\" }", err.Error(), message)
}

func CreateDefaultSeed(this js.Value, args []js.Value) interface{} {
	res, err := api.CreateDefaultSeed()
	if err != nil {
		return jsonError("unable to create default seed", err)
	}
	j := dictToJSON(dict{
		"seed": res,
	})
	return j
}

func CreateAgentIdentity(this js.Value, args []js.Value) interface{} {
	return createTypedIdentity(agentIdType, this, args)
}

func CreateUserIdentity(this js.Value, args []js.Value) interface{} {
	return createTypedIdentity(userIdType, this, args)
}

func CreateTwinIdentity(this js.Value, args []js.Value) interface{} {
	return createTypedIdentity(twinIdType, this, args)
}

func createTypedIdentity(idType IdType, this js.Value, args []js.Value) interface{} {
	if len(args) != 4 {
		return jsonError("required 4 arguments: resolverAddress, keyName, name, seed", errors.New("invalid argument"))
	}
	cResolverAddress := args[0].String()
	cKeyName := args[1].String()
	cName := args[2].String()
	cSeed := args[3].String()
	return createIdentity(idType, cResolverAddress, cKeyName, cName, cSeed, false)
}

func createIdentity(
	idType IdType, // true for userId, false for agentId
	resolverAddress string,
	keyName string,
	name string,
	seed string,
	override bool,
) interface{} {
	jsLog("seed: '" + seed + "'")
	seedBytes, err := hex.DecodeString(seed)
	if err != nil {
		return jsonError("failed to decode seed", err)
	}
	addr, err := url.Parse(resolverAddress)
	if err != nil {
		return jsonError("parsing resolver address failed", err)
	}

	opts := &api.CreateIdentityOpts{
		Seed:    seedBytes,
		KeyName: keyName,
		//Password: nil,
		Name:     name,
		Method:   crypto.SeedMethodBip39,
		Override: override,
	}

	resolver := register.NewDefaultRestResolverClient(addr)
	var id register.RegisteredIdentity
	if idType == userIdType {
		id, err = api.CreateUserIdentity(resolver, opts)
	} else if idType == agentIdType {
		id, err = api.CreateAgentIdentity(resolver, opts)
	} else {
		id, err = api.CreateTwinIdentity(resolver, opts)
	}

	if err != nil {
		return jsonError("unable to create identity", err)
	}

	return dictToJSON(dict{
		"did": id.Did(),
	})
}

func StoreValueInDOM(jsV js.Value, inputs []js.Value) interface{} {
	message := inputs[0].String()
	h := js.Global().Get("document").Call("getElementById", "message")
	h.Set("textContent", message)
	return nil
}

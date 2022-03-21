package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"syscall/js"

	"github.com/btcsuite/btcutil/base58"

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

type apiError struct {
	err     error
	message string
}

func (ae *apiError) toJSON() map[string]interface{} {
	return dict{
		"error":   ae.err.Error(),
		"message": ae.message,
	}
}

func NewApiError(message string, err error) *apiError {
	return &apiError{
		err:     err,
		message: message,
	}
}

func jsLog(s string) {
	js.Global().Get("console").Call("log", s)
}

// init is called even before main is called.
// This ensures that as soon as our WebAssembly module is ready in the browser,
// it runs and prints "Hello, webAssembly!" to the console. It then proceeds
// to create a new channel. The aim of this channel is to keep our Go app
// running until we tell it to abort.
func init() {
	fmt.Println("IOTICS Identity WebAssembly initializing!")
	c = make(chan bool)
}

func main() {
	// here, we are simply declaring the our function `sayHelloJS` as a global JS function. That means we can call it just like any other JS function.
	js.Global().Set("CreateDefaultSeed", js.FuncOf(CreateDefaultSeedP))
	js.Global().Set("CreateAgentIdentity", js.FuncOf(CreateAgentIdentityP))
	js.Global().Set("CreateUserIdentity", js.FuncOf(CreateUserIdentityP))
	js.Global().Set("CreateTwinIdentity", js.FuncOf(CreateTwinIdentityP))
	js.Global().Set("DelegateControl", js.FuncOf(DelegateControlP))
	js.Global().Set("GetRegisteredDocument", js.FuncOf(GetRegisteredDocumentP))

	println("IOTICS Identity WebAssembly initialised!")

	// tells the channel we created in init() to "stop".
	<-c
}

// NewHandler
// see https://withblue.ink/2020/10/03/go-webassembly-http-requests-and-promises.html
func NewHandler(callback func(js.Value, []js.Value) (interface{}, *apiError), this js.Value, args []js.Value) interface{} {
	handler := js.FuncOf(func(_ js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]
		// Run this code asynchronously
		go func() {
			result, errorObject := callback(this, args)
			if errorObject != nil {
				reject.Invoke(errorObject.toJSON())
			} else {
				// Resolve the Promise
				jsLog(fmt.Sprintf("resolve"))
				resolve.Invoke(result)
				jsLog(fmt.Sprintf("resolved"))
			}
		}()

		// The handler of a Promise doesn't return any value
		return nil
	})

	// Create and return the Promise object
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

func CreateDefaultSeedP(this js.Value, args []js.Value) interface{} {
	return NewHandler(createDefaultSeed, this, args)
}

func createDefaultSeed(this js.Value, args []js.Value) (interface{}, *apiError) {
	res, err := api.CreateDefaultSeed()
	if err != nil {
		return nil, NewApiError("unable to create default seed", err)
	}
	seed58 := base58.Encode(res)
	mnemonics, err := crypto.SeedBip39ToMnemonic(res)
	if err != nil {
		return nil, NewApiError("unable to generate mnemonics", err)
	}

	return dict{
		"seed":      seed58,
		"mnemonics": mnemonics,
	}, nil

}

func GetRegisteredDocumentP(this js.Value, args []js.Value) interface{} {
	return NewHandler(getRegisteredDocument, this, args)
}

func getRegisteredDocument(this js.Value, args []js.Value) (interface{}, *apiError) {
	if len(args) != 2 {
		return nil, NewApiError("required 2 arguments: resolverAddress, did", errors.New("invalid argument"))
	}

	addr, err := url.Parse(args[0].String())
	if err != nil {
		return nil, NewApiError("parsing resolver address failed", err)
	}
	resolverClient := register.NewDefaultRestResolverClient(addr)

	doc, err := api.GetRegisteredDocument(resolverClient, args[1].String())
	if err != nil {
		return nil, NewApiError("unable to get registered document", err)
	}
	jDoc, err := json.Marshal(doc)
	if err != nil {
		return nil, NewApiError("unable to marshall document into json", err)
	}

	return dict{
		"doc": string(jDoc),
	}, nil
}

func DelegateControlP(this js.Value, args []js.Value) interface{} {
	return NewHandler(delegateControl, this, args)
}

func delegateControl(this js.Value, args []js.Value) (interface{}, *apiError) {
	if len(args) != 4 {
		return nil, NewApiError("required 4 arguments: resolverAddress, twinDiD, agentDiD, delegationName", errors.New("invalid argument"))
	}

	addr, err := url.Parse(args[0].String())
	if err != nil {
		return nil, NewApiError("parsing resolver address failed", err)
	}

	twinOpts := convertToGetIdentityOpts(args[1])
	twinId, err := api.GetTwinIdentity(twinOpts)
	if err != nil {
		return nil, NewApiError("unable to get registered identity for twin", err)
	}

	agentOpts := convertToGetIdentityOpts(args[2])
	agentId, err := api.GetTwinIdentity(agentOpts)
	if err != nil {
		return nil, NewApiError("unable to get registered identity for agent", err)
	}

	delegationName := args[3].String()

	resolverClient := register.NewDefaultRestResolverClient(addr)

	err = api.DelegateControl(resolverClient, twinId, agentId, delegationName)

	if err != nil {
		return nil, NewApiError("unable to delegate", err)
	}

	return dict{
		"twinDid":        twinId.Did(),
		"agentDid":       agentId.Did(),
		"delegationName": delegationName,
	}, nil
}

func CreateAgentIdentityP(this js.Value, args []js.Value) interface{} {
	return NewHandler(createAgentIdentity, this, args)
}

func CreateUserIdentityP(this js.Value, args []js.Value) interface{} {
	return NewHandler(createUserIdentity, this, args)
}

func CreateTwinIdentityP(this js.Value, args []js.Value) interface{} {
	return NewHandler(createTwinIdentity, this, args)
}

func createAgentIdentity(this js.Value, args []js.Value) (interface{}, *apiError) {
	return createTypedIdentity(agentIdType, this, args)
}

func createUserIdentity(this js.Value, args []js.Value) (interface{}, *apiError) {
	return createTypedIdentity(userIdType, this, args)
}

func createTwinIdentity(this js.Value, args []js.Value) (interface{}, *apiError) {
	return createTypedIdentity(twinIdType, this, args)
}

func createTypedIdentity(idType IdType, this js.Value, args []js.Value) (interface{}, *apiError) {
	if len(args) != 2 {
		return nil, NewApiError("required 2 arguments: resolverAddress, identityOpts", errors.New("invalid argument"))
	}
	cResolverAddress := args[0].String()
	if len(cResolverAddress) == 0 {
		return nil, NewApiError("invalid resolverAddress", errors.New("resolver address not a url"))
	}
	identityOpts := convertToCreateIdentityOpts(args[1])

	jsLog(fmt.Sprintf("%+v: %+v", idType, identityOpts))

	return createIdentity(idType, cResolverAddress, identityOpts)
}

func createIdentity(
	idType IdType, // true for userId, false for agentId
	resolverAddress string,
	identityOpts *api.CreateIdentityOpts,
) (interface{}, *apiError) {
	addr, err := url.Parse(resolverAddress)
	if err != nil {
		return nil, NewApiError("parsing resolver address failed", err)
	}

	resolver := register.NewDefaultRestResolverClient(addr)
	var id register.RegisteredIdentity
	if idType == userIdType {
		id, err = api.CreateUserIdentity(resolver, identityOpts)
	} else if idType == agentIdType {
		id, err = api.CreateAgentIdentity(resolver, identityOpts)
	} else {
		id, err = api.CreateTwinIdentity(resolver, identityOpts)
	}

	if err != nil {
		return nil, NewApiError("unable to create identity", err)
	}

	return dict{
		"did": id.Did(),
	}, nil
}

func StoreValueInDOM(jsV js.Value, inputs []js.Value) interface{} {
	message := inputs[0].String()
	h := js.Global().Get("document").Call("getElementById", "message")
	h.Set("textContent", message)
	return nil
}

func cast(in map[string]interface{}) map[string]string {
	mapString := make(map[string]string)

	for key, value := range in {
		strKey := fmt.Sprintf("%v", key)
		strValue := fmt.Sprintf("%v", value)

		mapString[strKey] = strValue
	}
	return mapString
}

func convertToCreateIdentityOpts(sIdentityOpts js.Value) *api.CreateIdentityOpts {
	return &api.CreateIdentityOpts{
		Seed:     base58.Decode(sIdentityOpts.Get("seed").String()),
		KeyName:  sIdentityOpts.Get("key").String(),
		Password: sIdentityOpts.Get("password").String(),
		Name:     sIdentityOpts.Get("name").String(),
		Method:   crypto.SeedMethodBip39,
		Override: sIdentityOpts.Get("override").Truthy(),
	}

}

func convertToGetIdentityOpts(sIdentityOpts js.Value) *api.GetIdentityOpts {
	return &api.GetIdentityOpts{
		Seed:     base58.Decode(sIdentityOpts.Get("seed").String()),
		Did:      sIdentityOpts.Get("did").String(),
		KeyName:  sIdentityOpts.Get("key").String(),
		Password: sIdentityOpts.Get("password").String(),
		Name:     sIdentityOpts.Get("name").String(),
		Method:   crypto.SeedMethodBip39,
	}

}

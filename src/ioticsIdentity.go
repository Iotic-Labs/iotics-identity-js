package main

/**
Copyright 2022 IOTICS

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"syscall/js"
	"time"

	"github.com/ReneKroon/ttlcache/v2"
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

func (s IdType) String() string {
	switch s {
	case userIdType:
		return "user"
	case agentIdType:
		return "agent"
	case twinIdType:
		return "twin"
	}
	return "unknown"
}

type dict = map[string]interface{}

var done chan bool

var cacheAgentIdentities *ttlcache.Cache

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

func jsInfo(s string) {
	js.Global().Get("console").Call("info", s)
}

func jsDebug(s string) {
	js.Global().Get("console").Call("debug", s)
}

// init is called even before main is called.
// This ensures that as soon as our WebAssembly module is ready in the browser,
func init() {
	jsInfo("IOTICS Identity WebAssembly initializing!")
	done = make(chan bool)
	cacheAgentIdentities = ttlcache.NewCache()
	// TODO: make it configurable
	agentCacheTTL := time.Second * 10
	cacheAgentIdentities.SetTTL(time.Duration(agentCacheTTL))
	cacheAgentIdentities.SetCacheSizeLimit(128)

	newItemCallback := func(key string, value interface{}) {
		//jsDebug(fmt.Sprintf("New key(%s) added\n", key))
	}
	cacheAgentIdentities.SetNewItemCallback(newItemCallback)
	expirationCallback := func(key string, reason ttlcache.EvictionReason, value interface{}) {
		//jsDebug(fmt.Sprintf("This key(%s) has expired because of %s\n", key, reason))
	}
	cacheAgentIdentities.SetExpirationReasonCallback(expirationCallback)

	// we have to declare our functions in an init func otherwise they aren't
	// available in JS land at the call time.

	lib := js.Global().Get("ioticsIdentity")
	if lib.IsNull() {
		jsInfo("Your module should be exported as ioticsIdentityBrowser or ioticsIdentityNode!")
		panic("IOTICS Identity WebAssembly NOT initialised!")
	}
	e := "browser"
	if isNode() {
		e = "node"
	}
	jsInfo(fmt.Sprintf("Environment detected: %+v", e))

	var id = lib.Get("IoticsIdentity")

	id.Set("setIdentitiesCacheConfig", js.FuncOf(SetIdentitiesCacheConfig))
	id.Set("createDefaultSeed", js.FuncOf(CreateDefaultSeedP))
	id.Set("createAgentIdentity", js.FuncOf(CreateAgentIdentityP))
	id.Set("createUserIdentity", js.FuncOf(CreateUserIdentityP))
	id.Set("createTwinIdentity", js.FuncOf(CreateTwinIdentityP))
	id.Set("delegateControl", js.FuncOf(DelegateControlP))
	id.Set("delegateAuthentication", js.FuncOf(DelegateAuthenticationP))
	id.Set("getRegisteredDocument", js.FuncOf(GetRegisteredDocumentP))
	id.Set("createAgentAuthToken", js.FuncOf(CreateAgentAuthTokenP))
	id.Set("exit", js.FuncOf(Exit))
	id.Set("ping", js.FuncOf(Ping))

	jsInfo("IOTICS Identity WebAssembly initialised!")

}

func isNode() bool {
	proc := js.Global().Get("process")
	val := proc.Get("title")
	return !val.IsNull() && val.String() == "node"
}

func main() {
	// tells the channel we created in init() to "stop".

	if isNode() {
		js.Global().Get("process").Call("on", "SIGTERM", js.FuncOf(func(js.Value, []js.Value) interface{} {
			done <- true
			return nil
		}))
		// this is defined in the node branch of index.js to callback when the initialisation is complete
		js.Global().Call("startCb")
	}

	for {
		select {
		case <-done:
			return
		default:
			time.Sleep(500 * time.Millisecond)
		}
	}
}

func Exit(this js.Value, args []js.Value) interface{} {
	jsInfo("IOTICS Identity WebAssembly terminating!")
	// unblocks the main method allowing this application to exit.
	// useful in non-browser based applications
	done <- true
	jsInfo("IOTICS Identity WebAssembly terminated!")
	return dict{
		"ok": true,
	}
}

func Ping(this js.Value, args []js.Value) interface{} {
	return dict{
		"result": "pong",
	}
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
				resolve.Invoke(result)
			}
		}()

		// The handler of a Promise doesn't return any value
		return nil
	})

	// Create and return the Promise object
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

func SetIdentitiesCacheConfig(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return NewApiError("required 1 argument: cache config", fmt.Errorf("invalid argument")).toJSON()
	}

	v := args[0]
	a := v.Get("ttlSec")
	if !a.IsNull() {
		ttlSec, err := strconv.Atoi(a.String())
		if err != nil {
			return NewApiError("invalid integer: ttl (seconds)", err).toJSON()
		}
		if ttlSec < 1 {
			return NewApiError("negative ttl", fmt.Errorf("invalid argument")).toJSON()
		}

		cacheAgentIdentities.SetTTL(time.Duration(ttlSec))
	}

	a = v.Get("size")
	if !a.IsNull() {
		size, err := strconv.Atoi(a.String())
		if err != nil {
			return NewApiError("invalid integer: size", err).toJSON()
		}
		if size < 1 {
			return NewApiError("negative or empty size", fmt.Errorf("invalid argument")).toJSON()
		}

		cacheAgentIdentities.SetCacheSizeLimit(int(size))
	}

	return dict{
		"ok": true,
	}
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

func CreateAgentAuthTokenP(this js.Value, args []js.Value) interface{} {
	return NewHandler(createAgentAuthToken, this, args)
}

func createAgentAuthToken(this js.Value, args []js.Value) (interface{}, *apiError) {

	if len(args) != 4 {
		return nil, NewApiError("required 4 arguments: agentDiD, userDiD, duration(ms), audience", errors.New("invalid argument"))
	}

	agentOpts := convertToGetIdentityOpts(args[0])
	agentId, err := getCachedIdentity(agentIdType, agentOpts)
	if err != nil {
		return nil, NewApiError("unable to get registered identity for agent", err)
	}
	userDiD := args[1].String()
	durationMillisS := args[2].String()
	durationMillis, err := strconv.ParseInt(durationMillisS, 10, 64)
	if durationMillis < 1 {
		return nil, NewApiError("invalid duration in millis - must be a positive integer", err)
	}
	durationMillisD := time.Duration(durationMillis) * time.Millisecond
	audience := args[3].String()
	token, err := api.CreateAgentAuthToken(agentId, userDiD, durationMillisD, audience)

	if err != nil {
		return nil, NewApiError("unable to generate token", err)
	}

	if err != nil {
		return nil, NewApiError("unable to generate token", err)
	}

	tokenS := fmt.Sprintf("%+v", token)

	return dict{
		"token": tokenS,
	}, nil
}

func DelegateAuthenticationP(this js.Value, args []js.Value) interface{} {
	return NewHandler(delegateAuthentication, this, args)
}

func delegateAuthentication(this js.Value, args []js.Value) (interface{}, *apiError) {
	return delegateAuthenticationOrControl(this, args, userIdType)
}

func DelegateControlP(this js.Value, args []js.Value) interface{} {
	return NewHandler(delegateControl, this, args)
}

func delegateControl(this js.Value, args []js.Value) (interface{}, *apiError) {
	return delegateAuthenticationOrControl(this, args, twinIdType)
}

func delegateAuthenticationOrControl(this js.Value, args []js.Value, subjectType IdType) (interface{}, *apiError) {
	if subjectType != userIdType && subjectType != twinIdType {
		return nil, NewApiError(fmt.Sprintf("subject must be either user or twin", subjectType.String()), errors.New("invalid argument"))
	}

	if len(args) != 4 {
		return nil, NewApiError(fmt.Sprintf("required 4 arguments: resolverAddress, %sDiD, agentDiD, delegationName", subjectType.String()), errors.New("invalid argument"))
	}

	addr, err := url.Parse(args[0].String())
	if err != nil {
		return nil, NewApiError("parsing resolver address failed", err)
	}

	subjectIdOpts := convertToGetIdentityOpts(args[1])
	var subjectId register.RegisteredIdentity
	if subjectType == userIdType {
		subjectId, err = getCachedIdentity(userIdType, subjectIdOpts)
	} else if subjectType == twinIdType {
		subjectId, err = getCachedIdentity(twinIdType, subjectIdOpts)
	}
	if err != nil {
		return nil, NewApiError("unable to get registered identity for user", err)
	}

	agentOpts := convertToGetIdentityOpts(args[2])
	agentId, err := getCachedIdentity(agentIdType, agentOpts)
	if err != nil {
		return nil, NewApiError("unable to get registered identity for agent", err)
	}

	delegationName := args[3].String()

	resolverClient := register.NewDefaultRestResolverClient(addr)

	err = api.DelegateControl(resolverClient, subjectId, agentId, delegationName)

	if err != nil {
		return nil, NewApiError("unable to delegate", err)
	}

	return dict{
		"did":            subjectId.Did(),
		"subjectType":    subjectType.String(),
		"agentDid":       agentId.Did(),
		"delegationName": delegationName,
	}, nil
}

func getCachedIdentity(idType IdType, opts *api.GetIdentityOpts) (register.RegisteredIdentity, error) {
	did := opts.Did
	if value, exists := cacheAgentIdentities.Get(did); exists == nil {
		return value.(register.RegisteredIdentity), nil
	}
	var err error
	var identity register.RegisteredIdentity
	if idType == agentIdType {
		identity, err = api.GetAgentIdentity(opts)
	} else if idType == userIdType {
		identity, err = api.GetUserIdentity(opts)
	} else if idType == twinIdType {
		identity, err = api.GetTwinIdentity(opts)
	} else {
		return nil, fmt.Errorf("invalid identity type: %+v", idType)
	}

	if err != nil {
		return nil, err
	}
	if err = cacheAgentIdentities.Set(did, identity); err != nil {
		jsInfo("Unable to cache element " + did)
	}
	return identity, nil
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

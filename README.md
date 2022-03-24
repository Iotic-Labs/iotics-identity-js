# IOTICS Identity Library for JavaScript

Simple wrapper for the [IOTICS golang identity library](https://github.com/Iotic-Labs/iotics-identity-go)  high level API.

## Build

The applications are packed with webpack. The libraries are built in the `./dist` directory

### Install npm dependencies

```shell
npm install
```

### Make browser library

```shell
make build-wasm build-browser
```

Run an http server with `make serve` and navigate to `http://localhost:9090` to access the example application at `examples/browser`

### Make node library

```shell
make build-wasm build-browser
```

## TODO

List of things that need to be done

### Features

1. Not all APIs have been mapped
2. Functions are exported in the global namespace - maybe there's a better way
3. node is using active wait to pause for 500ms to wait for the functions to be loaded in the js global.
4. npm packaging and deployment

### Known Issues

1. The node examples are still buggy - golang wasm compiles net/http client using `fetch` so, in node `node-fetch` must be correctly installed and loaded.

## References

- https://medium.com/@jeantimex/create-a-javascript-library-and-fully-automate-the-releases-ccce93153dbb
- https://github.com/golang/go/issues/29845

## How to use it: Javascript

Import the library

```javascript
const { IoticsIdentity, loadLib } = ioticsIdentityBrowser;
```

The `loadLib` function loads the lib wasm. The `IoticsIdentity` object is the namespace of the functions of the library.

### Objects

Error object returned by the functions when an error occurs

```json
// Error
{
  "error": "<value>",
  "message": "<value>",
}
```

Object used to retrieve an identity

```json
// GetIdentityOptions
{
   "seed": "<string>. base58 encoded>",
   "did": "<string>",
   "key": "<string>",
   "password": "<optional string>",
   "name": "<string, must start with #>"
}
```

Object used to create an identity. The override flag is used to override any existing document in the resolver.

```json
// CreateIdentityOptions 
{
   "seed": "<string>. base58 encoded>",
   "did": "<string>",
   "key": "<string>",
   "password": "<optional string>",
   "name": "<string, must start with #>",
   "override": "<boolean>"
}
```

The registered DiD document as described [here](https://github.com/Iotic-Labs/iotics-identity-go/blob/3ebc587960d15fa86ddb12c66dfbec711fec5e8a/pkg/register/document.go#L54)

```json
// Document
{
}
```

The object containing the seed

```json
// Seed 
{
   "seed": "<string>. base58 encoded>",
} 
```

A DiD ID

```json
// DiD 
{
  "did": "<string>"
} 
```

The data for the delegation that's been just created

```json
// DelegationData 
{
 "did":            "<string>",
 "subjectType":    "<string. one of user, twin, agent>",
 "agentDid":       "<string>",
 "delegationName": "<string>", 
} 
```

Cache configuration object

```json
// CacheConfig 
{
   "ttlSec": "<integer, default 10 seconds>",
   "size": "<integer, default 128>"
}

```

Object containing a jwt token

```json
// Token
{
  "token": "<jwt token string>"
}
```

The following functions are methods of the object `IoticsIdentity`:


```javascript
/**
  * terminates the wasm module
  */
function exitLib() 

/**
  * Creates a 256 bits seed encoded base58
  *
  * @returns Promise of: Seed | Error
  */
function createDefaultSeed()

/**
  * Creates the identity of an agent. It is idempotent, so if the identity exists, it won't be created, unless the option "override" is specified.
  * 
  * @param {String} resolverAddress
  * @param {CreateIdentityOption} identityOpts
  * @returns Promise of: DiD JSON or error JSON
  */
function createAgentIdentity(resolverAddress, identityOpts)

/**
  * Creates the identity of a user. It is idempotent, so if the identity exists, it won't be created, unless the option "override" is specified.
  * 
  * @param {String} resolverAddress
  * @param {CreateIdentityOption} identityOpts
  * @returns Promise of: DiD | Error
  */
function createUserIdentity(resolverAddress, identityOpts)

/**
  * Creates the identity of a twin. It is idempotent, so if the identity exists, it won't be created, unless the option "override" is specified.
  *
  * @param {String} resolverAddress
  * @param {CreateIdentityOption} identityOpts
  * @returns Promise of: DiD | Error
  */
function createTwinIdentity(resolverAddress, identityOpts)

/**
  * Retrieves the document from the resolver. 
  * 
  * @param {String} resolverAddress
  * @param {String} didId
  * @returns Promise of: DiD | Error
  */
function getRegisteredDocument(resolverAddress, didId) 

/**
  * 
  * Twin delegates control, with given name, to agent 
  * 
  * @param {String} resolverAddress 
  * @param {IdentityOptions} twinIdentityOpts 
  * @param {IdentityOptions} agentIdentityOpts 
  * @param {String} delegationName 
  * @returns Promise of: DelegationData | Error
  */
function delegateControl(resolverAddress, twinIdentityOpts, agentIdentityOpts, delegationName)

/**
  * User delegates authentication, with given name, to agent 
  * 
  * @param {String} resolverAddress 
  * @param {IdentityOptions} userIdentityOpts 
  * @param {IdentityOptions} agentIdentityOpts 
  * @param {String} delegationName 
  * @returns Promise of: DelegationData | Error
  */
function delegateAuthentication(resolverAddress, userIdentityOpts, agentIdentityOpts, delegationName)

/**
  * Creates a token to authenticate this agent on behalf of the user, to the "audience" endpoint. 
  * 
  * The token is valid for the given duration in milliseconds.
  * 
  * @param {IdentityOptions} agentIdentityOps 
  * @param {String} userDiD 
  * @param {Integer} durationMs 
  * @param {String} audience 
  * @returns Promise of: Token | Error
  */
function createAgentAuthToken(agentIdentityOps, userDiD, durationMs, audience) 

/** 
  * Configures cache holding known Identities. 
  * 
  * @param {CacheConfig} conf 
  * @returns Error | nil 
  */
function setIdentitiesCacheConfig(conf)

```
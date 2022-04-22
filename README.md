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

## How to use it: Javascript

### Load the library

```npm i iotics-identity-js```

#### NodeJS

Import the library in NodeJS

```javascript
import pkg from 'iotics-identity-js/dist/nodejs/ioticsIdentity.js';
```

See example in `examples/nodejs/example.mjs`

#### Browser

If you bundle your browser application, import `iotics-identity-js/dist/browser/ioticsIdentity.js`, else,
copy the files from `node_modules/iotics-identity-js/dist/browser` in your environment and load them as

```html
  <script src="./ioticsIdentity.js"></script>
```

Then, in your application:

```javascript
const { IoticsIdentity, loadLib } = ioticsIdentity;
```

The `loadLib` function loads the lib wasm. The `IoticsIdentity` object is the namespace of the functions of the library.

### Objects

`Error` Error object returned by the functions when an error occurs

```json

{
  "error": "<value>",
  "message": "<value>",
}
```

`GetIdentityOptions` Object used to retrieve an identity

```json
{
   "seed": "<string>. base58 encoded>",
   "did": "<string>",
   "key": "<string>",
   "password": "<optional string>",
   "name": "<string, must start with #>"
}
```

`CreateIdentityOptions` Object used to create an identity. The override flag is used to override any existing document in the resolver.

```json

{
   "seed": "<string>. base58 encoded>",
   "did": "<string>",
   "key": "<string>",
   "password": "<optional string>",
   "name": "<string, must start with #>",
   "override": "<boolean>"
}
```

`Document` The registered DiD document as described [here](https://github.com/Iotic-Labs/iotics-identity-go/blob/3ebc587960d15fa86ddb12c66dfbec711fec5e8a/pkg/register/document.go#L54)

```json
{
   "@context": "<string>",   
   "id":  "<string>",
   "ioticsSpecVersion": "<string>", 
   "ioticsDIDType": "<string>",
   "controller":  "<string>",
   "creator":  "<string>",
   "updateTime":  "<number>",
   "proof":  "<string>",
   "revoked":  "<boolean>",
   "authentication": "<array of RegisterPublicKey>",
   "publicKey": "<array of RegisterPublicKey>",
   "delegateAuthentication": "<array of RegisterDelegationProof>",
   "delegateControl": "<array of RegisterDelegationProof>",
   "metadata": "<Metadata>",
}

```

`Metadata` optional structure in the DiD document

```json
{
  "label": "<optional string>",
  "comment": "<optional string>",
  "url": "<optional string>",
}
```

`RegisterPublicKey` structure for key used in authentication and publicKey in lists.

```json
{
 "id": "<string>",
 "type": "<string>",
 "publicKeyBase58": "<string>",
 "revoked": "<optional boolean>"
}
```

`RegisterDelegationProof` structure on delegation.

```json
{
"id": "<string>",
"controller": "<string>",
"proof": "<string>",
"revoked": "<optional boolean>",
}
```

`Seed` The object containing the seed

```json

{
   "seed": "<string>. base58 encoded>",
} 

```

`DiD` A DiD ID

```json

{
  "did": "<string>"
} 

```

`DelegationData` The data for the delegation that's been just created

```json

{
 "did":            "<string>",
 "subjectType":    "<string. one of user, twin, agent>",
 "agentDid":       "<string>",
 "delegationName": "<string>", 
} 

```

`CacheConfig` Cache configuration object

```json
 
{
   "ttlSec": "<integer, default 10 seconds>",
   "size": "<integer, default 128>"
}

```

`Token` Object containing a jwt token

```json

{
  "token": "<jwt token string>"
}
```

The following functions are methods of the object `IoticsIdentity`:

```javascript
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

## References

Thank you to:

- [create-a-javascript-library-and-fully-automate-the-releases](https://medium.com/@jeantimex/create-a-javascript-library-and-fully-automate-the-releases-ccce93153dbb)
- [wasm: global functions from wasm not working from node](https://github.com/golang/go/issues/29845)
- [how-to-bundle-your-library-for-both-nodejs-and-browser-with-webpack](https://levelup.gitconnected.com/how-to-bundle-your-library-for-both-nodejs-and-browser-with-webpack-3584ec8197eb)

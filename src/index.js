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


const go = new Go(); // Defined in wasm_exec.js
const WASM_URL = './ioticsIdentity.wasm';
const { isNode } = require('browser-or-node');

var wasm;

/**
 * Loads the underlying WASM library 
 * @returns 
 */
function loadLib() {
    let wasmBuffer

    if (isNode) {
        const { fs } = require('fs');
        wasmBuffer = fs.readFileSync(WASM_URL);
    } else {
        wasmBuffer = fetch(WASM_URL + "?ts=" + Date.now(), {
            method: 'GET',
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache',
            },
        })
    }

    if ('instantiateStreaming' in WebAssembly) {
        return WebAssembly.instantiateStreaming(wasmBuffer, go.importObject).then(function (obj) {
            wasm = obj.instance;
            go.run(wasm);
        })
    } else {
        return wasmBuffer.then(resp =>
            resp.arrayBuffer()
        ).then(bytes =>
            WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
                wasm = obj.instance;
                go.run(wasm);
            })
        )
    }
}


/**
 * Error
 * {
 *   "error": "<value>",
 *   "message": "<value>",
 * }
 * 
 * GetIdentityOptions
 * {
 *    "seed": <string. base58 encoded>
 *    "did": <string>
 *    "key": <string>
 *    "password": <string, optional>
 *    "name": <string, must start with #>
 * }
 * 
 * CreateIdentityOptions 
 * {
 *    "seed": <string. base58 encoded>
 *    "did": <string>
 *    "key": <string>
 *    "password": <string, optional>
 *    "name": <string, must start with #>
 *    "override": <boolean>
 * }
 * 
 * Document:
 * {
 *   //  see <link to golang struct>
 * }
 * 
 * Seed 
 * {
 *   "seed": <string. base58 encoded>
 * } 
 *
 * DiD 
 * {
 *   "did": <string>
 * } 
 *
 * DelegationData 
 * {
 *  "did":            <string>,
 *	"subjectType":    <string. one of user, twin, agent>,
 *	"agentDid":       <string>,
 *	"delegationName": delegationName, 
 * } 
 *
 * CacheConfig 
 * {
 *    "ttlSec": <integer, default 10s>,
 *    "size": <integer, default 128>
 * }
 * 
 * Token
 * {
 *   "token": <jwt token string>
 * }
 */

//////////////

/**
 * Creates a 256 bits seed encoded base58
 * 
 * @returns Promise of: Seed | Error
 */
function createDefaultSeed() {
    return CreateDefaultSeed()
}

/**
 * Creates the identity of an agent. It is idempotent, so if the identity exists, it won't be created, unless the option "override" is specified.
 * 
 * @param {String} resolverAddress
 * @param {CreateIdentityOption} identityOpts
 * @returns Promise of: DiD JSON or error JSON
 */
function createAgentIdentity(resolverAddress, identityOpts) {
    return CreateAgentIdentity(resolverAddress, identityOpts)
}

/**
 * Creates the identity of a user. It is idempotent, so if the identity exists, it won't be created, unless the option "override" is specified.
 * 
 * @param {String} resolverAddress
 * @param {CreateIdentityOption} identityOpts
 * @returns Promise of: DiD | Error
 */
function createUserIdentity(resolverAddress, identityOpts) {
    return CreateUserIdentity(resolverAddress, identityOpts)
}

/**
 * Creates the identity of a twin. It is idempotent, so if the identity exists, it won't be created, unless the option "override" is specified.
 *
 * @param {String} resolverAddress
 * @param {CreateIdentityOption} identityOpts
 * @returns Promise of: DiD | Error
 */
function createTwinIdentity(resolverAddress, identityOpts) {
    return CreateTwinIdentity(resolverAddress, identityOpts)
}

/**
 * Retrieves the document from the resolver. 
 * 
 * @param {String} resolverAddress
 * @param {String} didId
 * @returns Promise of: DiD | Error
 */
function getRegisteredDocument(resolverAddress, didId) {
    return GetRegisteredDocument(resolverAddress, didId)
}

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
function delegateControl(resolverAddress, twinIdentityOpts, agentIdentityOpts, delegationName) {
    return DelegateControl(resolverAddress, twinIdentityOpts, agentIdentityOpts, delegationName)
}

/**
 * User delegates authentication, with given name, to agent 
 * 
 * @param {String} resolverAddress 
 * @param {IdentityOptions} userIdentityOpts 
 * @param {IdentityOptions} agentIdentityOpts 
 * @param {String} delegationName 
 * @returns Promise of: DelegationData | Error
 */
function delegateAuthentication(resolverAddress, userIdentityOpts, agentIdentityOpts, delegationName) {
    return DelegateAuthentication(resolverAddress, userIdentityOpts, agentIdentityOpts, delegationName)
}

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
function createAgentAuthToken(agentIdentityOps, userDiD, durationMs, audience) {
    return CreateAgentAuthToken(agentIdentityOps, userDiD, durationMs, audience)
}

/** 
 * Configures cache holding known Identities. 
 * 
 * @param {CacheConfig} conf 
 * @returns Error | nil 
 */
function setIdentitiesCacheConfig(conf) {
    return SetIdentitiesCacheConfig(conf)
}

module.exports = {
    loadLib: () => loadLib(),
    createDefaultSeed: () => createDefaultSeed(),
    setIdentitiesCacheConfig: (conf) => setIdentitiesCacheConfig(conf),
    getRegisteredDocument: (rAddr, didId) => getRegisteredDocument(rAddr, didId),
    createAgentIdentity: (rAddr, identityOpts) => createAgentIdentity(rAddr, identityOpts),
    createUserIdentity: (rAddr, identityOpts) => createUserIdentity(rAddr, identityOpts),
    createTwinIdentity: (rAddr, identityOpts) => createTwinIdentity(rAddr, identityOpts),
    delegateControl: (rAddr, twinIdentityOpts, agentIdentityOpts, delegationName) => delegateControl(rAddr, twinIdentityOpts, agentIdentityOpts, delegationName),
    delegateAuthentication: (rAddr, userIdentityOpts, agentIdentityOpts, delegationName) => delegateAuthentication(rAddr, userIdentityOpts, agentIdentityOpts, delegationName),
    createAgentAuthToken: (agentIdentityOps, userDiD, durationMs, audience) => createAgentAuthToken(agentIdentityOps, userDiD, durationMs, audience)
};

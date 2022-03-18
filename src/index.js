const go = new Go(); // Defined in wasm_exec.js
const WASM_URL = './ioticsIdentity.wasm';

var wasm;

function loadLib() {
    if ('instantiateStreaming' in WebAssembly) {
        return WebAssembly.instantiateStreaming(fetch(WASM_URL), go.importObject).then(function (obj) {
            wasm = obj.instance;
            go.run(wasm);
        })
    } else {
        var requestHeaders = new Headers();
        requestHeaders.append('pragma', 'no-cache');
        requestHeaders.append('cache-control', 'no-cache');

        var fetchParams = {
            method: 'GET',
            headers: requestHeaders,
        };

        return fetch(WASM_URL + "?ts=" + Date.now(), fetchParams).then(resp =>
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
 * Error JSON 
 * {
 *   "error": "<value>",
 *   "message": "<value>",
 * }
 */

//////////////

/**
 * Returns either a json object 
 * 
 * { "seed": "<value>" }
 * 
 * or Error JSON
 * 
 * @returns JSON object
 */
function createDefaultSeed() {
    result = CreateDefaultSeed()
    return JSON.parse(result)
}

/**
 * Returns either a json object 
 * 
 * {
 *   "did": "<value>"
 * }
 * 
 * or
 * 
 * {
 *   "error": "<value>"
 * }
 * @returns JSON object
 */
function createAgentIdentity(resolverAddress, key, name, seed) {
    return CreateAgentIdentity(resolverAddress, key, name, seed)
}

function createUserIdentity(resolverAddress, key, name, seed) {
    return CreateUserIdentity(resolverAddress, key, name, seed)
}

function createTwinIdentity(resolverAddress, key, name, seed) {
    return CreateTwinIdentity(resolverAddress, key, name, seed)
}

module.exports = {
    loadLib: () => loadLib(),
    createDefaultSeed: () => createDefaultSeed(),
    createAgentIdentity: (rAddr, k, n, seed) => createAgentIdentity(rAddr, k, n, seed),
    createUserIdentity: (rAddr, k, n, seed) => createUserIdentity(rAddr, k, n, seed),
    createTwinIdentity: (rAddr, k, n, seed) => createTwinIdentity(rAddr, k, n, seed),
};

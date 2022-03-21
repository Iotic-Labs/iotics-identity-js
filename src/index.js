const go = new Go(); // Defined in wasm_exec.js
const WASM_URL = './ioticsIdentity.wasm';

var wasm;

function loadLib() {
    let url = WASM_URL + "?ts=" + Date.now()
    let requestHeaders = new Headers();
    requestHeaders.append('pragma', 'no-cache');
    requestHeaders.append('cache-control', 'no-cache');

    let fetchParams = {
        method: 'GET',
        headers: requestHeaders,
    };
    if ('instantiateStreaming' in WebAssembly) {
        return WebAssembly.instantiateStreaming(fetch(url, fetchParams), go.importObject).then(function (obj) {
            wasm = obj.instance;
            go.run(wasm);
        })
    } else {

        return fetch(url, fetchParams).then(resp =>
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
    return CreateDefaultSeed()
}

function newIdentity(seed, key, name, password, override) {
    return {
        "seed": seed,
        "key": key,
        "name": name,
        "password": password,
        "override": override
    }
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
function createAgentIdentity(resolverAddress, identityOpts) {
    return CreateAgentIdentity(resolverAddress, identityOpts)
}

function createUserIdentity(resolverAddress, identityOpts) {
    return CreateUserIdentity(resolverAddress, identityOpts)
}

function createTwinIdentity(resolverAddress, identityOpts) {
    return CreateTwinIdentity(resolverAddress, identityOpts)
}

function getRegisteredDocument(resolverAddress, didId) {
    return GetRegisteredDocument(resolverAddress, didId)
}

function delegateControl(resolverAddress, twinIdentityOpts, agentIdentityOpts, delegationName) {
    return DelegateControl(resolverAddress, twinIdentityOpts, agentIdentityOpts, delegationName)
}

function delegateAuthentication(resolverAddress, userIdentityOpts, agentIdentityOpts, delegationName) {
    return DelegateAuthentication(resolverAddress, userIdentityOpts, agentIdentityOpts, delegationName)
}

module.exports = {
    loadLib: () => loadLib(),
    createDefaultSeed: () => createDefaultSeed(),
    getRegisteredDocument: (rAddr, didId) => getRegisteredDocument(rAddr, didId),
    createAgentIdentity: (rAddr, identityOpts) => createAgentIdentity(rAddr, identityOpts),
    createUserIdentity: (rAddr, identityOpts) => createUserIdentity(rAddr, identityOpts),
    createTwinIdentity: (rAddr, identityOpts) => createTwinIdentity(rAddr, identityOpts),
    delegateControl: (rAddr, twinIdentityOpts, agentIdentityOpts, delegationName) => delegateControl(rAddr, twinIdentityOpts, agentIdentityOpts, delegationName),
    delegateAuthentication: (rAddr, userIdentityOpts, agentIdentityOpts, delegationName) => delegateAuthentication(rAddr, userIdentityOpts, agentIdentityOpts, delegationName),
    newIdentity: (seed, key, name, password, override) => newIdentity(seed, key, name, password, override),
};

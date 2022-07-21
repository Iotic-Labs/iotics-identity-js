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

const { IoticsIdentity, loadLib } = ioticsIdentity;

/**
 * global loader - initialises the wasm and then the UI.
 */
window.onload = function (e) {
    loadLib().then(() => {
        console.log("wasm lib loaded");
        initUi();
    });
};

function initUi() {
    setEventById("createDefaultSeedId", "click", createDefaultSeedClick)
    setEventById("createUserIdentityId", "click", createUserIdentityClick)
    setEventById("createAgentIdentityId", "click", createAgentIdentityClick)
    setEventById("createTwinIdentityId", "click", createTwinIdentityClick)
    setEventById("delegateAuthenticationId", "click", delegateAuthenticationClick)
    setEventById("delegateControlId", "click", delegateControlClick)
    setEventById("createAgentAuthTokenId", "click", createAgentAuthTokenClick)
    setEventById("setIdentitiesCacheConfigId", "click", setIdentitiesCacheConfigClick)

    setEventById("getUserDocId", "click", getUserDocClick)
    setEventById("getAgentDocId", "click", getAgentDocClick)
    setEventById("getTwinDocId", "click", getTwinDocClick)
}

function outputJSON(v) {
    var o = v
    if (getType(v) == 'string') {
        o = JSON.parse(v)
    }
    content = JSON.stringify(o, "", 2)
    setHtml("output-text", content)
}

/**
 * 
 * @param {String} token 
 * @returns the proof JSON
 */
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

async function createAgentAuthTokenClick() {
    agentGetIdentityOpts = newGetIdentityOpts("agent")
    userDiD = getValueById("userDidId")
    durationMs = getValueById("tokenDuration")
    audience = getValueById("tokenAudience")

    json = await IoticsIdentity.createAgentAuthToken(agentGetIdentityOpts, userDiD, durationMs, audience)

    if (getCheckedById("unpackToken") == true) {
        json = parseJwt(json.token)
    }

    outputJSON(json)
    return false;
}

async function createDefaultSeedClick() {
    json = await IoticsIdentity.createDefaultSeed()
    setValueById("seed", json.seed)
    outputJSON(json)
    return false;
}

function setIdentitiesCacheConfigClick() {
    ttl = getValueById("cacheTtl")
    size = getValueById("cacheSize")
    conf = {
        "ttlSec": ttl,
        "size": size,
    }
    json = IoticsIdentity.setIdentitiesCacheConfig(conf)
    outputJSON(json)
    return false;
}

async function getUserDocClick() {
    return getRegisteredDocByType("user")
}

async function getAgentDocClick() {
    return getRegisteredDocByType("agent")
}

async function getTwinDocClick() {
    return getRegisteredDocByType("twin")
}

async function createAgentIdentityClick() {
    return createIdentityClick(IoticsIdentity.createAgentIdentity, "agent")
}

async function createUserIdentityClick() {
    return createIdentityClick(IoticsIdentity.createUserIdentity, "user")
}

async function createTwinIdentityClick() {
    return createIdentityClick(IoticsIdentity.createTwinIdentity, "twin")
}

async function getRegisteredDocByType(type) {
    resolver = getValueById("resolverId")
    v = getValueById(type + "DidId")
    json = await IoticsIdentity.getRegisteredDocument(resolver, v);
    jDoc = JSON.parse(json.doc)
    outputJSON(jDoc)
    return false;
}

async function createIdentityClick(func, type) {
    resolver = getValueById("resolverId")
    json = await func(resolver, newCreateIdentityOpts(type));
    outputJSON(json)
    setValueById(type + "DidId", json.did)
    return false;
}

async function delegateControlClick() {
    resolver = getValueById("resolverId")
    twinGetIdentityOpts = newGetIdentityOpts("twin")
    agentGetIdentityOpts = newGetIdentityOpts("agent")
    delegationName = getValueById("controlDelegationName")
    json = await IoticsIdentity.delegateControl(resolver, twinGetIdentityOpts, agentGetIdentityOpts, delegationName)
    outputJSON(json)
    return false
}

async function delegateAuthenticationClick() {
    resolver = getValueById("resolverId")
    userGetIdentityOpts = newGetIdentityOpts("user")
    agentGetIdentityOpts = newGetIdentityOpts("agent")
    delegationName = getValueById("authenticationDelegationName")
    json = await IoticsIdentity.delegateAuthentication(resolver, userGetIdentityOpts, agentGetIdentityOpts, delegationName)
    outputJSON(json)
    return false
}

function newCreateIdentityOpts(idType) {
    return {
        "seed": getValueById("seed"),
        "key": getValueById(idType + "KeyId"),
        "name": getValueById(idType + "NameId"),
        "password": null,
        "override": false
    }
}

function newGetIdentityOpts(idType) {
    return {
        "seed": getValueById("seed"),
        "key": getValueById(idType + "KeyId"),
        "did": getValueById(idType + "DidId"),
        "name": getValueById(idType + "NameId"),
        "password": null,
    }
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function getValueById(id) {
    return document.getElementById(id).value
}

function setValueById(id, value) {
    return document.getElementById(id).value = value
}

function setHtml(id, content) {
    document.getElementById(id).innerHTML = content
}

function setEventById(id, event, handler) {
    document.getElementById(id).addEventListener(event, handler);
}

function getCheckedById(id) {
    return document.getElementById(id).checked
}
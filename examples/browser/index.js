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

const { loadLib, createDefaultSeed, createAgentIdentity, createTwinIdentity, createUserIdentity, delegateControl, delegateAuthentication, getRegisteredDocument, createAgentAuthToken, setIdentitiesCacheConfig } = ioticsIdentityBrowser;

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
    $("#createDefaultSeedId").click(createDefaultSeedClick)
    $("#createUserIdentityId").click(createUserIdentityClick)
    $("#createAgentIdentityId").click(createAgentIdentityClick)
    $("#createTwinIdentityId").click(createTwinIdentityClick)
    $("#delegateAuthenticationId").click(delegateAuthenticationClick)
    $("#delegateControlId").click(delegateControlClick)
    $("#createAgentAuthTokenId").click(createAgentAuthTokenClick)
    $("#setIdentitiesCacheConfigId").click(setIdentitiesCacheConfigClick)

    $("#getUserDocId").click(getUserDocClick)
    $("#getAgentDocId").click(getAgentDocClick)
    $("#getTwinDocId").click(getTwinDocClick)
}

function outputJSON(v) {
    var o = v
    if (getType(v) == 'string') {
        o = JSON.parse(v)
    }
    $("#output-text").html(JSON.stringify(o, "", 2));
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
    userDiD = $("#userDidId").val()
    durationMs = $("#tokenDuration").val()
    audience = $("#tokenAudience").val()

    json = await createAgentAuthToken(agentGetIdentityOpts, userDiD, durationMs, audience)


    if ($("#unpackToken").prop("checked") == true) {
        json = parseJwt(json.token)
    }

    outputJSON(json)
    return false;
}

async function createDefaultSeedClick() {
    json = await createDefaultSeed()
    $("#seed").val(json.seed)
    outputJSON(json)
    return false;
}

function setIdentitiesCacheConfigClick() {
    ttl = $("#cacheTtl").val()
    size = $("#cacheSize").val()
    conf = {
        "ttlSec": ttl,
        "size": size,
    }
    json = setIdentitiesCacheConfig(conf)
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
    return createIdentityClick(createAgentIdentity, "agent")
}

async function createUserIdentityClick() {
    return createIdentityClick(createUserIdentity, "user")
}

async function createTwinIdentityClick() {
    return createIdentityClick(createTwinIdentity, "twin")
}

async function getRegisteredDocByType(type) {
    resolver = $("#resolverId").val()
    v = $("#" + type + "DidId").val()
    json = await getRegisteredDocument(resolver, v);
    jDoc = JSON.parse(json.doc)
    outputJSON(jDoc)
    return false;
}

async function createIdentityClick(func, type) {
    resolver = $("#resolverId").val()
    json = await func(resolver, newCreateIdentityOpts(type));
    outputJSON(json)
    $("#" + type + "DidId").val(json.did)
    return false;
}

async function delegateControlClick() {
    resolver = $("#resolverId").val()
    twinGetIdentityOpts = newGetIdentityOpts("twin")
    agentGetIdentityOpts = newGetIdentityOpts("agent")
    delegationName = $("#controlDelegationName").val()
    json = await delegateControl(resolver, twinGetIdentityOpts, agentGetIdentityOpts, delegationName)
    outputJSON(json)
    return false
}

async function delegateAuthenticationClick() {
    resolver = $("#resolverId").val()
    userGetIdentityOpts = newGetIdentityOpts("user")
    agentGetIdentityOpts = newGetIdentityOpts("agent")
    delegationName = $("#authenticationDelegationName").val()
    json = await delegateAuthentication(resolver, userGetIdentityOpts, agentGetIdentityOpts, delegationName)
    outputJSON(json)
    return false
}

function newCreateIdentityOpts(idType) {
    return {
        "seed": $("#seed").val(),
        "key": $("#" + idType + "KeyId").val(),
        "name": $("#" + idType + "NameId").val(),
        "password": null,
        "override": false
    }
}

function newGetIdentityOpts(idType) {
    return {
        "seed": $("#seed").val(),
        "key": $("#" + idType + "KeyId").val(),
        "did": $("#" + idType + "DidId").val(),
        "name": $("#" + idType + "NameId").val(),
        "password": null,
    }
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}
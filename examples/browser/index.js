const { loadLib, createDefaultSeed, createAgentIdentity, createTwinIdentity, createUserIdentity, delegateControl, getRegisteredDocument } = ioticsIdentity;

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
    $("#delegateControlId").click(delegateControlClick)

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

async function createDefaultSeedClick() {
    json = await createDefaultSeed()
    $("#seed").val(json.seed)
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
    delegationName = "del-" + $("#twinNameId").val() + "-" + $("#agentNameId").val()
    json = await delegateControl(resolver, twinGetIdentityOpts, agentGetIdentityOpts, delegationName)
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
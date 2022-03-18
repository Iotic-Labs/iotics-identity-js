const { loadLib, createDefaultSeed, createAgentIdentity, createTwinIdentity, createUserIdentity } = ioticsIdentity;

window.onload = function (e) {
    loadLib().then(() => {
        console.log("wasm lib loaded");
        initUi();
    });
};

function initUi() {
    $("#createDefaultSeedId").unbind('click');
    $("#createDefaultSeedId").click(createDefaultSeedClick)
    $("#createUserIdentityId").unbind('click');
    $("#createUserIdentityId").click(createUserIdentityClick)
    $("#createAgentIdentityId").unbind('click');
    $("#createAgentIdentityId").click(createAgentIdentityClick)
    $("#createTwinIdentityId").unbind('click');
    $("#createTwinIdentityId").click(createTwinIdentityClick)
}

function outputJSON(v) {
    var o = v
    if (getType(v) == 'string') {
        o = JSON.parse(v)
    }
    $("#output-text").html(JSON.stringify(o));
}

async function createDefaultSeedClick() {
    json = await createDefaultSeed()
    $("#seed").val(json.seed)
    outputJSON(json)
    return false;
}

async function createAgentIdentityClick() {
    resolver = $("#resolverId").val()
    agentName = $("#agentNameId").val()
    agentKeyId = $("#agentKeyId").val()
    seed = $("#seed").val()
    json = await createAgentIdentity(resolver, agentKeyId, agentName, seed);
    outputJSON(json)
    return false;
}

async function createUserIdentityClick() {
    resolver = $("#resolverId").val()
    agentName = $("#userNameId").val()
    agentKeyId = $("#userKeyId").val()
    seed = $("#seed").val()
    json = await createUserIdentity(resolver, agentKeyId, agentName, seed);
    outputJSON(json)
    return false;
}

async function createTwinIdentityClick() {
    resolver = $("#resolverId").val()
    agentName = $("#twinNameId").val()
    agentKeyId = $("#twinKeyId").val()
    seed = $("#seed").val()
    json = await createTwinIdentity(resolver, agentKeyId, agentName, seed);
    outputJSON(json)
    return false;
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}
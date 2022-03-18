const { loadLib, createDefaultSeed, createAgentIdentity } = ioticsIdentity;

window.onload = function (e) {
    loadLib().then(() => {
        console.log("wasm lib loaded");
        initUi();
    });
};

function initUi() {

}

function createDefaultSeedCallback() {
    json = createDefaultSeed();
    $("#createDefaultSeedOutput").text(json.seed);
}

function createAgentIdentityCallback() {
    resolver = $("#resolverId").val()
    agentName = $("#agentNameId").val()
    agentKeyId = $("#agentKeyId").val()
    seed = $("#createDefaultSeedOutput").val()
    json = createAgentIdentity(resolver, agentKeyId, agentName, seed);
    $("#createAgentIdentityOutput").text(JSON.stringify(json));
}

function createUserIdentityCallback() {
    resolver = $("#resolverId").val()
    agentName = $("#userNameId").val()
    agentKeyId = $("#userKeyId").val()
    seed = $("#createDefaultSeedOutput").val()
    json = createUserIdentity(resolver, agentKeyId, agentName, seed);
    $("#createUserIdentityOutput").text(JSON.stringify(json));
}

function createTwinIdentityCallback() {
    resolver = $("#resolverId").val()
    agentName = $("#twinNameId").val()
    agentKeyId = $("#twinKeyId").val()
    seed = $("#createDefaultSeedOutput").val()
    json = createTwinIdentity(resolver, agentKeyId, agentName, seed);
    $("#createTwinIdentityOutput").text(JSON.stringify(json));
}


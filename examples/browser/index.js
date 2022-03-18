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

async function createDefaultSeedClick() {
    json = await createDefaultSeed();
    $("#seed").val(json.seed)
    $("#output-text").html(JSON.stringify(json));
    return false;
}

function createAgentIdentityClick() {
    resolver = $("#resolverId").val()
    agentName = $("#agentNameId").val()
    agentKeyId = $("#agentKeyId").val()
    seed = $("#seed").val()
    json = createAgentIdentity(resolver, agentKeyId, agentName, seed);
    $("#output-text").html(JSON.stringify(json));
    return false;
}

function createUserIdentityClick() {
    resolver = $("#resolverId").val()
    agentName = $("#userNameId").val()
    agentKeyId = $("#userKeyId").val()
    seed = $("#seed").val()
    json = createUserIdentity(resolver, agentKeyId, agentName, seed);
    $("#output-text").html(JSON.stringify(json));
    return false;
}

function createTwinIdentityClick() {
    resolver = $("#resolverId").val()
    agentName = $("#twinNameId").val()
    agentKeyId = $("#twinKeyId").val()
    seed = $("#seed").val()
    json = createTwinIdentity(resolver, agentKeyId, agentName, seed);
    $("#output-text").html(JSON.stringify(json));
    return false;
}


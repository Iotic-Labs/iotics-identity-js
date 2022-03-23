let ioticsIdentity = require("./ioticsIdentity.js")

ioticsIdentity.loadLib().then(() => {
    console.log("wasm lib loaded");
});

## this is a hack - there must be a better way to polyfill the golang_wasm.js to load crypto.

NEW="const nodeCrypto=require(\"crypto\"); globalThis.crypto = { getRandomValues(b) { nodeCrypto.randomFillSync(b); }, };"
OLD="throw new Error(\"globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)\");"
sed -i "s/${OLD}/${NEW}/" dist/nodejs/ioticsIdentity.js

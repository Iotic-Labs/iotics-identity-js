NEW="const nodeCrypto=require(\"crypto\"); globalThis.crypto = { getRandomValues(b) { nodeCrypto.randomFillSync(b); }, };"
OLD="throw new Error(\"globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)\");"
sed -i "s/${OLD}/${NEW}/" examples/node/ioticsIdentity.js

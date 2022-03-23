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

import pkg from './ioticsIdentityNode.js';
const {
    loadLib,
    createDefaultSeed,
    getRegisteredDocument,
    createAgentIdentity,
    createUserIdentity,
    createTwinIdentity,
    delegateControl,
    delegateAuthentication,
    createAgentAuthToken
} = pkg;

const RESOLVER = "https://did.stg.iotics.com"
const SEED = "EcnwYkUvCwZUrX4QbChrLXBuEc5qsVxMr5upX3VSsmgo"
const USER_NAME = "#user-0"
const AGENT_NAME = "#agent-0"
const TWIN_NAME = "#twin-0"
const USER_KEY = "#user-key-0"
const AGENT_KEY = "#agent-key-0"
const TWIN_KEY = "#twin-key-0"
const AUDIENCE = "https://your.iotics.space"

function newCreateIdentityOpts(idType) {
    return {
        "seed": $("#seed").val(),
        "key": $("#" + idType + "KeyId").val(),
        "name": $("#" + idType + "NameId").val(),
        "password": null,
        "override": false
    }
}


loadLib().then(() => {
    createDefaultSeed().then((response) => console.log("seed: " + JSON.stringify(response)))

    createAgentIdentity(RESOLVER, {
        "seed": SEED,
        "key": AGENT_KEY,
        "name": AGENT_NAME,
        "password": null,
        "override": false
    }).then((resp) => {
        console.log("agent identity: " + resp)
    }).catch((err) => console.error(err))

    createUserIdentity(RESOLVER, {
        "seed": SEED,
        "key": USER_KEY,
        "name": USER_NAME,
        "password": null,
        "override": false
    }).then((resp) => {
        console.log("user identity: " + resp)
    }).catch((err) => console.error(err))

    createTwinIdentity(RESOLVER, {
        "seed": SEED,
        "key": TWIN_KEY,
        "name": TWIN_NAME,
        "password": null,
        "override": false
    }).then((resp) => {
        console.log("user identity: " + resp)
    }).catch((err) => console.error(err))

})



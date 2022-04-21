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


const go = new Go(); // Defined in wasm_exec.js
const WASM_URL = './ioticsIdentity.wasm';

var IoticsIdentity = {

}

/**
 * Loads the underlying WASM library 
 * @returns 
 */
async function loadLib() {

    const isNodeJS = global.process && global.process.title === "node";
    if (isNodeJS) {
        var fs = require('fs');
        var path = require('path');
        bytes = fs.readFileSync(path.join(__dirname, WASM_URL));

        global.startCb = () => {
            console.log("IOTICS Identity functions available in the global namespace")
        };

        function delay(t, v) {
            return new Promise(function (resolve) {
                setTimeout(resolve.bind(null, v), t)
            });
        }

        return WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
            go.run(obj.instance);
        }).then(() => {
            // turns out that the golang functions take a while to get published in the global namespace.
            // for now we wait a bit before returning the promise so that we give it enough time
            // in fact - it'll all be done once the startCb callback is invoked (this callback is called 
            // by the golang code)
            return delay(1500)
        })


    } else {
        let wasmBuffer = fetch(WASM_URL + "?ts=" + Date.now(), {
            method: 'GET',
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache',
            },
        })
        if ('instantiateStreaming' in WebAssembly) {
            return WebAssembly.instantiateStreaming(wasmBuffer, go.importObject).then(function (obj) {
                go.run(obj.instance);
            })
        } else {
            return wasmBuffer.then(resp =>
                resp.arrayBuffer()
            ).then(bytes =>
                WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
                    go.run(obj.instance);
                })
            )
        }

    }

}

module.exports = {
    IoticsIdentity: IoticsIdentity,
    loadLib: () => loadLib()
};

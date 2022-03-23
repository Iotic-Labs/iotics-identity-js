const go = new Go(); // Defined in wasm_exec.js
const WASM_URL = './main.wasm';

var wasm;

if ('instantiateStreaming' in WebAssembly) {
    WebAssembly.instantiateStreaming(fetch(WASM_URL), go.importObject).then(function (obj) {
        wasm = obj.instance;
        go.run(wasm);
    })
} else {
    fetch(WASM_URL).then(resp =>
        resp.arrayBuffer()
    ).then(bytes =>
        WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
            wasm = obj.instance;
            go.run(wasm);
        })
    )
}

function add(num1, num2) {
    Add(num1, num2)
}

module.exports = {
    add: (num1, num2) => Add(num1, num2)
};

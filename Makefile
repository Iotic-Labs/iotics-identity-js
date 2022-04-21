GO_EXEC := $(shell which go)
GO_BIN := $(shell dirname $(GO_EXEC))
GOROOT := $(shell dirname $(GO_BIN))

DIST_DIR=./dist
WASM_OUT=$(DIST_DIR)/ioticsIdentity.wasm
WASM_EXEC_JS=./src/wasm_exec.js
LIB_GO=./src/ioticsIdentity.go
BROWSER_EXAMPLES_DIR=./examples/browser
NODE_EXAMPLES_DIR=./examples/node


# since this is getting the file from the local machine, 
# it'll be bound to the installed golang version
$(DIST_DIR): 
	@mkdir -p $(DIST_DIR)

$(WASM_EXEC_JS): $(DIST_DIR)
	@cp ${GOROOT}/misc/wasm/wasm_exec.js $(WASM_EXEC_JS)

$(WASM_OUT): $(DIST_DIR)
	@GOOS=js GOARCH=wasm go build -o $(WASM_OUT) $(LIB_GO)


.PHONY: clean build-wasm build-browser build-node build serve

clean:
	@rm -rf $(DIST_DIR) $(WASM_EXEC_JS) $(BROWSER_EXAMPLES_DIR)/ioticsIdentity.* $(NODE_EXAMPLES_DIR)/ioticsIdentity.*

build-wasm: $(WASM_OUT) $(WASM_EXEC_JS)
	@cp $(WASM_OUT) $(BROWSER_EXAMPLES_DIR)
	@cp $(WASM_OUT) $(NODE_EXAMPLES_DIR)

build-browser: build-wasm
	@npm run build:browser
	 
build-node: build-wasm
	@npm run build:node

build: clean build-browser build-node

serve:
	@npx http-server -p 9090 -o $(BROWSER_EXAMPLES_DIR)

patch-node-polyfill:
	$(eval OLD:=throw new Error\(\"globalThis.crypto is not available, polyfill required \(crypto.getRandomValues only\)\"\)\;)
	$(eval NEW:=const nodeCrypto=require\(\"crypto\"\)\; globalThis.crypto = \{ getRandomValues\(b\) \{ nodeCrypto.randomFillSync\(b\)\; \}, \}\;)
	$(shell sed -i 's/$(OLD)/$(NEW)/' examples/node/ioticsIdentity.js)
	
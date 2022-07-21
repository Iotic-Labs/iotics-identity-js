GO_EXEC := $(shell which go)
GO_BIN := $(shell dirname $(GO_EXEC))
GOROOT := $(shell dirname $(GO_BIN))

DIST_DIR=./dist
SRC_DIR=./src
EXAMPLES_DIR=./examples
WASM_OUT=$(SRC_DIR)/ioticsIdentity.wasm
WASM_EXEC_JS=$(SRC_DIR)/wasm_exec.js
LIB_GO=$(SRC_DIR)/ioticsIdentity.go
BROWSER_EXAMPLES_DIR=$(EXAMPLES_DIR)/browser
NODE_EXAMPLES_DIR=$(EXAMPLES_DIR)/nodejs
BROWSER_DIST_DIR=$(DIST_DIR)/browser
NODE_DIST_DIR=$(DIST_DIR)/nodejs


# since this is getting the file from the local machine, 
# it'll be bound to the installed golang version
$(DIST_DIR): 
	@mkdir -p $(DIST_DIR)

$(WASM_EXEC_JS): $(DIST_DIR)
	@cp ${GOROOT}/misc/wasm/wasm_exec.js $(WASM_EXEC_JS)

$(WASM_OUT): 
	@GOOS=js GOARCH=wasm go build -o $(WASM_OUT) $(LIB_GO)


.PHONY: clean build-wasm build serve compile test

clean:
	@rm -rf $(DIST_DIR) $(WASM_EXEC_JS) ${WASM_OUT} $(BROWSER_EXAMPLES_DIR)/ioticsIdentity.* $(NODE_EXAMPLES_DIR)/ioticsIdentity.*

build-wasm: $(WASM_OUT) $(WASM_EXEC_JS)

npm-build: $(DIST_DIR) build-wasm
	@npm run build

compile: $(DIST_DIR) build-wasm npm-build
	$(shell ./polyfill_crypto_node.sh)
	@cp $(WASM_OUT) $(BROWSER_DIST_DIR) 
	@cp $(WASM_OUT) $(NODE_DIST_DIR) 

test-node: compile
	@node $(NODE_EXAMPLES_DIR)/example.mjs
	    
test-browser: compile
	@cp $(BROWSER_DIST_DIR)/* $(BROWSER_EXAMPLES_DIR)

build: clean compile test-node test-browser

serve:
	@npx http-server -p 9090 -o $(BROWSER_EXAMPLES_DIR)

# npm publish expects a publish npm token to be setup and configured in .npmrc
# https://docs.npmjs.com/about-access-tokens
publish:
	npm publish
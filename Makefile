GO_EXEC := $(shell which go)
GO_BIN := $(shell dirname $(GO_EXEC))
GOROOT := $(shell dirname $(GO_BIN))

WASM_OUT=./dist/ioticsIdentity.wasm
LIB_GO=./src/ioticsIdentity.go


# since this is getting the file from the local machine, 
# it'll be bound to the installed golang version
wasm-init: 
	@mkdir -p ./dist
	@cp ${GOROOT}/misc/wasm/wasm_exec.js ./src

wasm-build: wasm-clean wasm-init
	@GOOS=js GOARCH=wasm go build -o $(WASM_OUT) $(LIB_GO)
	@cp $(WASM_OUT) examples/browser

build: clean wasm-build
	@npm run build:browser
	 
wasm-clean: 
	@rm -f $(WASM_OUT) ./src/wasm_exec.js

clean: wasm-clean
	@rm -f ./dist/*

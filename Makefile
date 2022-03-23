GO_EXEC := $(shell which go)
GO_BIN := $(shell dirname $(GO_EXEC))
GOROOT := $(shell dirname $(GO_BIN))

WASM_OUT=./dist/main.wasm
LIB_GO=./src/main.go


# since this is getting the file from the local machine, 
# it'll be bound to the installed golang version
wasm-init: 
	@mkdir -p ./dist
	@cp ${GOROOT}/misc/wasm/wasm_exec.js ./src

build: clean wasm-init
	@GOOS=js GOARCH=wasm go build -o $(WASM_OUT) $(LIB_GO)


clean:
	@rm -f ./dist/* ./src/wasm_exec.js

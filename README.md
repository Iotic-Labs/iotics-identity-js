# IOTICS Identity Library for JavaScript

Simple wrapper for the [IOTICS golang identity library](https://github.com/Iotic-Labs/iotics-identity-go)  high level API.

## Build

The applications are packed with webpack. The libraries are built in the `./dist` directory

### Install npm dependencies

```shell
npm install
```

### Make browser library

```shell
make build-wasm build-browser
```

Run an http server with `make serve` and navigate to `http://localhost:9090` to access the example application at `examples/browser`

### Make node library

```shell
make build-wasm build-browser
```

## TODO

List of things that need to be done

### Features

1. Not all APIs have been mapped
2. Functions are exported in the global namespace - maybe there's a better way
3. node is using active wait to pause for 500ms to wait for the functions to be loaded in the js global.
4. npm packaging and deployment

### Known Issues

1. The node examples are still buggy - golang wasm compiles net/http client using `fetch` so, in node `node-fetch` must be correctly installed and loaded.

## References

- https://medium.com/@jeantimex/create-a-javascript-library-and-fully-automate-the-releases-ccce93153dbb
- https://github.com/golang/go/issues/29845

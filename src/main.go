package main

import (
	"fmt"
	"syscall/js"

	"strconv"
)

var c chan bool

// init is called even before main is called. This ensures that as soon as our WebAssembly module is ready in the browser, it runs and prints "Hello, webAssembly!" to the console. It then proceeds to create a new channel. The aim of this channel is to keep our Go app running until we tell it to abort.
func init() {
	fmt.Println("Hello, WebAssembly!")
	c = make(chan bool)
}

func main() {
	// here, we are simply declaring the our function `sayHelloJS` as a global JS function. That means we can call it just like any other JS function.
	js.Global().Set("add", js.FuncOf(Add))

	println("Done.. done.. done...")

	// tells the channel we created in init() to "stop".
	<-c
}

func Add(jsV js.Value, inputs []js.Value) interface{} {
	if len(inputs) != 2 {
		return fmt.Errorf("must pass two values")
	}
	i1, err := strconv.Atoi(inputs[0].String())
	if err != nil {
		return err
	}
	i2, err := strconv.Atoi(inputs[1].String())
	if err != nil {
		return err
	}

	return i1 + i2
}

func StoreValueInDOM(jsV js.Value, inputs []js.Value) interface{} {
	message := inputs[0].String()
	h := js.Global().Get("document").Call("getElementById", "message")
	h.Set("textContent", message)
	return nil
}

# Supported Types

Preszr supports all built-in object types, with few exceptions. Here is a complete list:

* All primitives
  * `number`
  * `symbol`
  *  `string`
  *  `null`
  *  `undefined`
  *  `bigint`
* Regular objects.
  * Including with symbol keys.
  * Including with a `null` prototype (special case).
* Regular arrays.
  * Including sparse arrays and arrays with string keys.
* Collections.
  * `Map`
  * `Set`
* `Date`
* `Error` and all its subtypes.
* Primitive wrappers, even though they are useless:
  * `Number`
  * `Boolean`
  * `String`
* Built-in binary types:
  * `Int8Array`
  * `Int16Array`
  * `Int32Array`
  * `BigInt64Array` (where available)
  * The unsigned versions of the above.
  * `Float32Array`
  * `Float64Array`
  * `DataView`
  * `ArrayBuffer`
  * `SharedArrayBuffer`
  * `DataView`

# Exceptions

The exceptions are all function-like, asynchronous, or have a hidden state that can't be reproduced. Not all of these have a constructor accessible in the global scope.

* Functions:
  * Function
  * AsyncFunction
  * GeneratorFunction
  * AsyncGeneratorFunction
* Generators:
  * Generator
  * AsyncGenerator
* Iterators:
  * Map Iterator
  * Set Iterator
  * Array Iterator
* Promise
* WeakSet
* WeakMap
* AsyncGenerator

Unsupported types just have a built-in encoding that generates a placeholder when decoded.
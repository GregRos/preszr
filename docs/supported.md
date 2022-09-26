# Supported types

`preszr` supports **all primitives** and **all object types that are [built-in and platform-independent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)**, **except** for some that it doesn't make sense to serialize. Here is a complete list:

❌ All functions, which includes: `Function`, `AsyncFunction`, `GeneratorFunction`, and `AsyncGeneratorFunction`.

❌ `Promise`

❌ `WeakMap`, `WeakSet`, `WeakRef`, and so on.

❌ `Generator` and its variants

❌ `FinalizationRegistry`.

❌ Built-in iterator types that aren't in the global scope.

The list of unsupported types is implemented as special encodings. Like all encodings, they can be [overriden and versioned](../README.md#Versioning), so you *could* implement encoders for any of these yourself.

## List of supported types

For completeness, here is the list of supported types and values. It's just a list of built-ins excludes the list above.

In all cases, it won't be able to decode something if it doesn't exist in the current environment (e.g. a `BigInt64Array` in Node.js 8.x).

✅ All primitive values and types, including `-Infinity`, `+Infinity`, `-0`, `NaN`, `undefined`, `bigint`.  Symbols <a href="../readme.md#symbols">require configuration</a>.

✅ Instances of the primitive wrappers, `Number`, `Boolean`, and `String` - even though they are useless.

✅ All built-in binary types: [`TypedArrays`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray), [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [`DataView`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/DataView), and [`SharedArrayBuffer`]([](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)).

✅ [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

✅ [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

✅ [Built-in errors types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#error_types), **including the stack trace.**



## Functions

Functions aren't data. Serializing them is out of scope and may not make sense. This group includes:

* Anything with a `function` type.
* `Function.prototype`
* `AsyncFunction.prototype`
* `GeneratorFunction.prototype`
* `AsyncGeneratorFunction.prototype`.

## Promises

Not data and can't be serialized.

* `Promise.prototype`

## Weak collections

Can't be enumerated and probably not meant for serialization.

* `WeakMap.prototype`
* `WeakSet.prototype`

## WeakRef

Probably not meant for serialization.

* `WeakRef.prototype`

## Generators and Iterators

Similar to functions. Can't be serialized.

* `Generator`
* `AsyncGenerator`
* `Array Iterator`
* `Set Iterator`
* `Map Iterator`

## 

**Functions: ** `Function`, `AsyncFunction`, `GeneratorFunction`, `AsyncGeneratorFunction`
It doesn't make sense

| Group            | Prototypes                                                   | Why      |
| ---------------- | ------------------------------------------------------------ | -------- |
| Functions        | `Function`, `AsyncFunction`, `GeneratorFunction`, `AsyncGeneratorFunction` | Not data |
| Promise          | `Promise`                                                    | Not data |
| Weak collections | `WeakMap`, `WeakSet`, `WeakRef`                              | Ca       |
|                  |                                                              |          |
|                  |                                                              |          |



When `preszr` encounters a value it unsupports, it won't error - it will instead replace it with a marker that indicates an unsupported value was encountered. This is because it aims to reproduce the input object as closely as possible, but it also doesn't want to just error if it encounters an object that was probably not meant for serialization.

`preszr` suppo

* All primitives
  * `number`
  * `symbol`
  * `string`
  * `null`
  * `undefined`
  * `bigint`
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
# Supported types

`preszr` supports **all primitives** and **all object types that are [built-in and platform-independent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)**, **except** for some that it doesn't make sense to serialize. Here is a complete list:

❌ All functions, which includes: `Function`, `AsyncFunction`, `GeneratorFunction`, and `AsyncGeneratorFunction`.

❌ `Promise`

❌ `WeakMap`, `WeakSet`, `WeakRef`, and so on.

❌ `Generator` and its variants

❌ `FinalizationRegistry`.

❌ Built-in iterator types that aren't in the global scope.

The list of unsupported types is implemented as special encodings. Like all encodings, they can be [overriden and versioned](../README.md#Versioning), so you _could_ implement encoders for any of these yourself.

## List of supported types

For completeness, here is the list of supported types and values. It's just a list of built-ins excludes the list above.

In all cases, it won't be able to decode something if it doesn't exist in the current environment (e.g. a `BigInt64Array` in Node.js 8.x).

✅ All primitive values and types, including `-Infinity`, `+Infinity`, `-0`, `NaN`, `undefined`, `bigint`. Symbols <a href="../readme.md#symbols">require configuration</a>.

✅ Instances of the primitive wrappers, `Number`, `Boolean`, and `String` - even though they are useless.

✅ All built-in binary types: [`TypedArrays`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray), [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [`DataView`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/DataView), and [`SharedArrayBuffer`](<[](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)>).

✅ [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

✅ [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

✅ [Built-in errors types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#error_types), **including the stack trace.**

# Szr

`szr` is a lightweight library for encoding complex objects so they can be serialized. 

The encoding `szr` uses creates a simple JSON output that describes objects, references between those objects, their prototypes, and so on. You can send this output over the network and use `szr` to reconstruct the original object at the destination, possibly attaching the correct prototype.

For more information about how `szr`represents objects, see *szr output* below.

`szr` supports almost all platform-independent objects out of the box and can be easily configured to support your own. It's highly customizable.

Szr does not use decorators or schemas. It's a lot simpler than that.

## Examples

```javascript
import {decode, encode, Szr} from "szr";


test("simple object", t => {
    const obj2 = {};
    const obj = {
        boolean: true,
        number: 1,
        nonJsonNumber: Infinity,
        string: "hello",
        null: null,
        map: new Map([[
            1, 1
        ]]),
        set: new Set([5]),
        array: [1],
        date: new Date(),
        regexp: /abc/gi,
        ref1: obj2,
        ref2: obj2
    };

    const decoded = decode(
        JSON.parse(JSON.stringify(encode(obj)))
    );
    t.deepEqual(decoded, obj);
    t.is(decoded.ref1, decoded.ref2);
});
```

## Supported Inputs

Szr has support for almost all JavaScript primitives.

* strings
* undefined
* null
* numbers
  * Including JSON-illegal values such as `Infinity`.
* boolean
* bigint
* symbols<sup>Requires some configuration</sup>

And many built-in objects:

* Plain objects and arrays
* Sparse arrays, arrays with string keys
* Objects with symbol keys
* Regular expressions
* Date
* Error
* Collections
  * Set
  * Map
* Platform-independent binary data
  * ArrayBuffer
  * TypedArrays
* The object versions of primitives: Number, String, etc.

\* Using symbols requires configuration. By default they are ignored.

The following are explicitly unsupported:

* Functions.
* `WeakMap` and `WeakSet`. It's impossible to support them.

The following information is generally discarded:

1. Additional object properties you add to known objects such as `Map`.
2. Property descriptors.
3. The state of sticky regular expressions.

## Usage

The `szr` package exposes three main members.

By default, an object encoded using a major version of the package can't be decoded by a different version. This behavior can be turned off.

### `encode` 

Encodes an object using default settings. Uses only built-in encodings.

```javascript
import {encode} from "szr";

const result = encode(someObject);
```

### `decode`

Decodes an object encoded using default settings. Uses only built-in encodings.

```javascript
import {encode, decode} from "szr";

const encoded = encode(someObject);
const result = decode(serialized);
```

### `Szr`

A encoder and decoder class. Use this to encode and decode objects with user-defined prototypes, symbols, and advanced encodings.

```typescript
import {Szr} from "szr";

const szr = new Szr({
	encodings: [
        //... optional
    ],
    options: {
        //... optional
    }
});

const encoded = szr.encode(someObject);
const decoded = szr.decode(encoded);
```

You need to make sure `szr` is configured in the same way in the source and the destination.

## Custom types

By default, `szr` is only familiar with the built-in prototypes and symbols. If you want it to correctly attach your own prototypes, you'll need to supply them. To do that, you can pass the constructors to the `encodings` property during creation:

```typescript
class A {}

class B {}

const szr = new Szr({
	encodings: [
		A,
        B
    ]
});
```

When `szr` encounters a prototype it doesn't know, it will use the closest prototype it *does* know, possibly descending down to `Object.prototype`. 

Note that if your constructor is nameless, or if some of them have the same names, you might have to do some more configuration. See the *encodings* section below.

### Symbols

`szr` recognizes symbols in general and knows about most of the built-in symbols. If you want it to recognize your own symbols, you'll need to supply them to `encodings` in the same way.

```typescript
const symbol = Symbol("test")
const szr = new Szr({
	encodings: [
        symbol
    ]
});
```

Just like with prototypes, if your symbol doesn't have a description or if you have several symbols with the same description, you'll have to supply a few more details. See more below.

*Unlike with prototypes*, `szr` will still try to represent symbols it doesn't know. When encoding, they will be marked as unknown symbols and their descriptions will be saved. When decoding, `szr` will generate a new symbol with a description similar to `szr unknown symbol X` for each symbol it doesn't recognize.

## Encodings

`szr` determines how to represent a particular object using an *encoding*. There are basically two types of encodings:

1. Symbol encodings.
2. Prototype encodings.

Every encoding has a unique `key` that identifies it.

### Symbol encodings

A symbol encoding is just an object that tells `szr` about a symbol. Here is its type:

```typescript
export interface SzrSymbolEncoding {
    key: string;
    symbol: symbol;
    metadata?: any;
}
```

If you supply a symbol to `encodings` directly, it will be converted to this type under the hood. The `key` is taken from the symbol description.

The `metadata` property is generally only used internally.

### Prototype encoding

A prototype encoding lets `szr` know how to encode and decode objects with specific prototypes. This only applies to proper objects - strings and the like are handled separately.

If you pass a constructor as an encoding, `szr` will generate a complete prototype encoding under the hood as best it can. In general, it will work properly, but in some cases you will need more configuration. For example, if the prototype is nameless or if there are several prototypes with the same name, you will need to at least supply a `key`.

```typescript
export interface SzrPrototypeSpecifier {
    key?: string;
    prototype: object | null;
    decoder?: Decoder;
    encode?(input: any, ctx: EncodeContext): SzrData;
}
```

You can write the same code in the previous section as follows:

```typescript
class A {}

class B {}

const szr = new Szr({
	encodings: [
		{
            key:"A", 
            prototype: A.prototype
        },
        {
            key: "B", 
            prototype: B.prototype
        }
    ]
});
```

You might notice that the encoding lets you specify `encode `and `decoder`. The default `encode` function uses the default object encoding. 

The default `decoder` will attach the prototype during decoding. It doesn't call the constructor, if any. 

If you need the constructor to be called or want to do something special during encoding or decoding, see the next section.

## Advanced encodings

Encodings are incredibly versatile and can be used to handle objects, arrays, collections such as `Map`, binary data, regular expressions, and so on. It's all about how `encode` and `decoder` work.

### Encode

The signature of this function is as follows:

```typescript
(input: any, ctx: EncodeContext) => SzrData;
```

This function should return simple data that can be represented in JSON. So that means:

1. JSON-compatible scalars, like numbers, strings, and so on.
2. Simple objects and arrays.

`szr` will not check your output, so you're responsible for making sure it's valid yourself.

`encode` takes two parameters:

1. The value being encoded.
2. `ctx`, the encoding context. This is an object that lets you communicate with the encoding process.

For simple objects, there is no need to use `ctx` at all. Just return an encoding of your object. However, `ctx` is important when your object contains other data or references to objects that themselves need to be encoded. To deal with these values, use the function `ctx.encode`.

`ctx.encode` is a kind of recursive call that encodes nested data. Note that it doesn't actually return the output of `szr.encode`. Unlike for example JSON, the `szr` format is not recursive. 

1. For entities that need to be referenced, such as most objects and symbols, it will encode them, add them to the final output, and return a reference you can plug in the correct location. Note that during this process, encoders will be used - including the one you're writing. Thus this function can end up calling your own `encode` implementation.
2. For JSON-legal scalars, it will just return the value back.
3. For scalars that aren't JSON-legal, it will return an encoded value.

You shouldn't care what `ctx.encode` returns. Just know that it's a JSON-legal value you can plug wherever it's needed. `szr` takes care of things like type checking for you.

#### Metadata

You can also set `ctx.metadata`. This is a kind of additional return value that will be stored in the szr output. You can use this value later during decoding.

### Decoder

Unlike encoding, decoding is a two-step process. Here is the type of the decoder:

```typescript
export interface Decoder {
    create(encoded: any, ctx: DecodeCreateContext): any;
    init?(target: any, encoded: any, ctx: DecodeInitContext): void;
}
```

#### Create

The first step is to create the decoded object. During this part of the process, you can only use the `encoded` and `ctx.metadata`. Unlike with encoding, you can't perform a call to look up another object - most of them don't exist yet.

The return value should be the base form of the object, usually without any internal data that needs to be decoded. In many cases, the objects will be "broken", such as objects having a particular prototype but lacking the data necessary to actually function.

#### Init

The second step is to initialize the object you created in the previous step, which is available through the `target` parameter. For simple objects like dates, regular expressions, and binary data this step isn't used at all - all the information that contain is unencoded. However, regular objects arrays need this extra step.

Note that the `init` method shouldn't return anything.

Here `ctx` exposes the member `ctx.decode` which is the reverse of `ctx.encode`. It will resolve references, decode unencoded scalars, and so on. However, there is a caveat.

**Most objects during this stage aren't initialized**

That means you shouldn't try to perform operations with decoded objects.

### Caveats

While this system is flexible enough to encode all sorts of objects, there are things it can't encode. For example, take the following object, which uses [JS private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields):

```typescript
class ClassWithPrivateField {
 	#value;
  	constructor(input) {
		this.#value = input;
 	}
	get value() {
        return this.#value;
    }
}
```

`szr` cannot decode this class.

1. During `create`, decoding internal data isn't available, so the contents of `value` (which could be another object) cannot be decoded.
2. During `init`, you can't return a newly constructed value and there is no way to call a class constructor on an arbitrary object. 

This problem might be solved by adding a `decode` function in the `create` phase. However, since objects haven't been created yet, this means the function would have to decode objects recursively. If an encoding tried to decode a reference to an object higher up the stack, it would have to error to avoid infinite recursion.

This could be solved by adding another member so it can be initialized separately.

## Szr Output

This section deals with how `szr` output looks when encoding *entities*. Entities are one of the following:

1. An object.
2. An array.
3. A string.
4. A symbol

`szr` can be used to encode numbers, booleans, and other scalar values, but in that case the output looks different.

The *szr output* is a single array:

```typescript
[header, szrData1, szrData2, szrData3, ...]
```

The first element of the array is always the *header*, which contains version and encoding information. The next element is the *szr representation* for the entity being encoded.

When encoding an entity, `szr` will recursively traverse it, adding the entities it references to the output and replacing them with *szr references* to those entities. An *szr reference* is simply `"${i}"` which `i` is the index of the entity in the array, e.g. `"1"`, `"2"` and so forth. Note that because the first element is always the header, `"0"` doesn't correspond to anything.

The exact *szr representation* of an entity depends on the encoding used. Here are representations for common entities.

1. **An object** - An object, with all references to entities replaced by *szr references*. Non-entity values remain as-is. Objects with symbol properties are handled differently.
2. **An array** - An array, with all entity elements replaced by *szr references*. Sparse arrays and arrays with string keys are handled differently.
3. **A string** - No special representation. Strings are treated as entities so that they aren't confused with szr references.
4. **A symbol** - 0. The identity of the symbol is stored as metadata.

In general, however, an *szr representation* can be any JSON-legal value - such as an object, a string, and so on.

### Encoding scalars

Some numeric values are valid in JavaScript but not in JSON. These values are specially encoded.

1. `Infinity` is encoded as `"Infinity"`.
2. `-Infinity` is encoded as `"-Infinity"`.
3. `-0` is encoded is `"-0"`.
4. `NaN` is encoded as `"NaN"`.
5. `undefined` is encoded as `-`
6. `bigint` is encoded as `"B${value}"`

### Header Structure

The header contains information about how the data was encoded. Its format is as follows:

```javascript
[majorVersion, encodingInformation, metadata]
```

#### Encoding Information

The encoding information is an object where the keys are szr references and the values are encoding keys. For example:

```typescript
{
	1: "Type1",
	2: "Type2",
    3: "symbol1"
}
```

Some built-in encodings have a special mode where they don't output encoding information. In this case, the library will infer the right encoding to use.

#### Metadata

Metadata is used to store extra information about an encoded entity. Its format is similar to encoding information, in that every key is an szr reference, but they can have any JSON-legal value.

```typescript
{
	1: true,
    2: {text: "hello"}
}
```

Metadata doesn't do anything unless an encoding explicitly uses it.

### Encoding non-entities

You can also encode non-entities using `szr` directly:

1. numbers
2. booleans
3. `null`
4. `undefined`

This won't have the same output as encoding entities. Instead, a single value is generally returned. If the input is JSON-legal, it will be returned. If it needs to be encoded, the encoded version is returned. There is no data array and no header.

Encoding and then decoding these values will give you the original value.


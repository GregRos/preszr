# preszr

[![Node.js CI](https://github.com/GregRos/preszr/actions/workflows/main.yaml/badge.svg)](https://github.com/GregRos/preszr/actions/workflows/main.yaml)
[![Coverage Status](https://coveralls.io/repos/github/GregRos/preszr/badge.svg?branch=master)](https://coveralls.io/github/GregRos/preszr?branch=master)
[![npm](https://img.shields.io/npm/v/preszr)](https://www.npmjs.com/package/preszr)

`preszr` is a *pre-serialization* library that allows you to serialize objects with meaningful references, prototypes, and arbitrary data types. 

It works by taking those objects and encoding them into simple objects with only JSON-legal data - the kind that can be understood by any serializer, whether it's `JSON.stringify` or anything else. It's similar, but not related to, the [preserialize](https://preserialize.readthedocs.io/en/latest/) Python package.

If you're curious about how `preszr` works, refer to the <u>Preszr Output</u>.

## Features

🔗 Preserves **all** references!

✨ Preserves prototypes!

🐐 Encodes *almost all* primitives and built-in object types!

🐤 Space-efficient format!

🛠️ Easily modifiable to support custom objects!

🔢 Compatible with arbitrary serializers!

🕵️ Many error cases and descriptive messages that make for better debugging!

:sweat_smile: Pain-painstakingly unit-tested for many, many possible inputs.

## Non-features

🚫 Doesn't use schemas or decorators¡

🛡️ Doesn't alter your objects¡

🔒 Doesn't require executing generated code¡

## Usage

To encode an object, use the `encode` function:

```typescript
import {encode} from "preszr";

const original = { /* ... */ }
const encoded = encode(original);
```

The result of `encode` is an array in *preszr format*, or in some cases a primitive. Whatever the result is, it can be serialized using any method that can serialize JSON.

After serializing the object and, say, sending it via the network, you'll need to `decode` it to get back the original form.

```typescript
import {decode} from "preszr";

const original = decode(encoded);
```

The default `encode` and `decode` functions will work for many objects out of the box, but they can't encode custom prototypes. To do that, you'll need create new `Preszr` instance and set the `encodings` array to contain some constructors:

```typescript
import {Preszr} from "preszr";

class Example {}
class Exmaple2 {}

// 'new' is optional
const myPreszr = Preszr({
    encodings: [
        Example,
        Example2
    ]
});
```

That's it. That's all you need to do for `preszr` to recognize those prototypes and preserve them.

You need to configure Preszr with the same prototype encodings in both the source and the destination, though the order doesn't matter. One way to do this while avoiding code duplication is to distribute a set of custom types together with an `Preszr` instance that can encode them.

When encoding an object with a prototype it doesn't know, `Preszr` will descend to the closest prototype it *does* know, possibly all the way down to `Object.prototype`.

## Installing

```bash
npm install preszr
```

Or:

```bash
yarn add preszr
```

## Unsupported Types

`preszr` will intelligently encode all [*platform-independent*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) objects, except for a few that are outside its scope. Those are explicitly *unsupported*. Here they are:

❌ `Function` and its variants

❌ `Promise`

❌ `WeakMap`, `WeakSet`, `WeakRef`, and so on.

❌ `Generator`

If you really want to see the list of supported types, see <u>supported.md</u>. You can also generate the list from any `Preszr` instance, as described in the `In-depth Configuration` section below.

When `preszr` encounters a value it unsupports, it won't error - it will instead replace it with a marker that indicates an unsupported value was encountered. This is because it aims to reproduce the input object as closely as possible, and just ignoring some of the data doesn't do that.

`preszr` will only look at *own* and *enumerable* keys, though, so it won't be bothered by things like methods, getters, and setters.

Oh, `preszr` won't intelligently encode things like HTML elements and arbitrary Node objects - those aren't platform-independent. You can totally *configure* it to do so, though, by adding a custom encoding.

## In-depth Encodings

The simple examples in the Usage section don't really do the encoding feature justice. Encodings let you use `preszr` to encode and decode custom objects in arbitrary ways. In fact, `preszr` encodes objects such as `Set` and `Map` using built-in encodings.

There are actually two types of encodings:

1. *Prototype encodings*, which are more interesting.
2. *Symbol encodings*, which also exist.

Every encoding has a unique `key` that identifies it. In addition to any encodings you provide, every instance of `preszr` already includes built-in encodings for all supported prototypes. Built-in encodings have keys starting with `Preszr/`, such as `Preszr/Map`. You can't create keys for encodings that start with `Preszr/` yourself.

### Prototype encoding

A prototype encoding lets `preszr` know how to encode and decode objects with specific prototypes. This only applies to proper objects - strings and the like are handled separately.

If you pass a constructor as an encoding, `preszr` will generate a complete prototype encoding under the hood. This encoding will:

1. When encoding, use the standard object encoder.
2. When decoding, it will use the standard object decoder and attach the correct prototype. No constructor will be executed.

In general, it will work properly, but in some cases you will need more configuration. The simplest case is if the constructor is nameless or if there are several constructors with the same name. In that case, you will need to supply an object with `key` and `prototype` instead:

```typescript
const nameless = (class {})

const preszr = Preszr({
    encodings: [{ 
        key: "Nameless", 
        prototype: nameless.prototype
    }]
});
```

However, prototype encodings are quite versatile and can do a lot more than this. Let's take a look at the interface of the prototype encoding specifier:

```typescript
export interface SzrPrototypeSpecifier {
    key?: string;
    prototype: object | null;
    decoder?: Decoder;
    encode?(input: any, ctx: EncodeContext): SzrEncodedEntity;
}
```

The actual logic of encoding and decoding is in the `decoder` object and the `encode` function.

#### Encode

The signature of this function is as follows:

```typescript
(input: any, ctx: EncodeContext) => SzrEncodedEntity;
```

This function should return simple data that can be represented in JSON. So that means:

1. JSON-compatible scalars, like numbers, strings, and so on.
2. Objects and arrays with no meaningful references or prototypes.

`preszr` will not check your output *by default*, but can be configured to do so. See *In-depth Configuration* below.

`encode` takes two parameters:

1. The value being encoded, `input`.
2. `ctx`, the encoding context. This is an object that lets you communicate with the encoding process.

For simple objects, there is no need to use `ctx` at all - all you need to generate an encoding of your object is to use `input`. However, `ctx` is important when your object contains other data or references to objects that themselves need to be encoded. To deal with these values, use the function `ctx.encode`.

`ctx.encode` is a kind of recursive call that encodes nested data. Note that it doesn't actually return the output of `Preszr.encode`.

1. For entities that need to be referenced, such as most objects and symbols, it will encode them, add them to the final output as a side-effect, and return a reference you can plug in the correct location. Note that during this process, encoders will be used - including the one you're writing. Thus this function can end up calling your own `encode` implementation on a different input.
2. For JSON-legal scalars, it will just return the value back.
3. For scalars that aren't JSON-legal, it will return an encoded value.

You shouldn't care what `ctx.encode` returns. Just know that it's a JSON-legal value you can plug wherever it's needed. `preszr` takes care of things like type checking for you.

#### Metadata

You can also set `ctx.metadata`. This is a kind of additional return value that will be stored in the preszr output. You can use this value later during decoding. This isn't necessary, since you could store this data in the encoded object, but it lets you encode things as arrays or even scalars, while also letting you store extra data about them.

`metadata` can be any JSON-legal object or value.

#### Decoder

Unlike encoding, decoding is a two-step process. Here is the type of the decoder:

```typescript
interface Decoder {
    create(encoded: SzrEncodedEntity, ctx: DecodeCreateContext): unknown;
    init?(target: any, encoded: SzrEncodedEntity, ctx: DecodeInitContext): void;
}
```

##### Create

The first step is to create the decoded object. During this part of the process, you can only use the `encoded` parameter, which contains the encoded value, and `ctx.metadata`. For some objects, those that don't reference other objects, this is enough.

The return value of the function should be the base form of the object, without any data that needs to be decoded. In many cases, the object will be "broken", such as having a particular prototype but lacking the data necessary to actually function.

##### Init

The second step is to initialize the object you created in the previous step, which is available through the `target` parameter. For simple objects like dates, regular expressions, and binary data this step isn't used at all - all the information they contain is unencoded. However, regular objects arrays need this extra step.

Here `ctx` exposes the member `ctx.decode` which is the reverse of `ctx.encode`. It will resolve references, decode unencoded scalars, and so on. However, there is a caveat - most objects during this stage aren't initialized. That means you shouldn't try to perform operations with objects you get from `ctx.decode`. Just plug the object you receive in the correct place.

#### Example

Take a look at how the `setEncoding` is implemented in the library, for encoding the JS collection `Set`:

```typescript
export const setEncoding: SzrPrototypeEncoding = {
    prototypes: [Set.prototype],
    key: getLibraryString("Set"),
    encode(input: Set<unknown>, ctx: EncodeContext): SzrEncodedEntity {
        const outArray: SzrLeaf[] = [];
        for (const item of input) {
            outArray.push(ctx.encode(item));
        }
        return outArray;
    },
    decoder: {
        create(): unknown {
            return new Set();
        },
        init(target: Set<unknown>, encoded: SzrLeaf[], ctx: DecodeInitContext) {
            for (const item of encoded) {
                target.add(ctx.decode(item));
            }
        }
    }
};
```

Note how each element of the set is encoded using `ctx.encode`. In `create`, an empty set is created, while in `init` we decode the elements of the set.

#### Caveats

While this system is flexible enough to work with almost all objects, there are objects it can't decode. For example, take the following object, which uses [JS private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields):

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

While `preszr` can encode this class (you would need to write a special encoder for it), it can't decode it, as the only way to set the field `#value` is via the constructor. The field might contain an object, so it has to be decoded as well. This raises a problem:

1. During `create`, decoding values isn't available since objects haven't been created yet.
2. During `init`, it's impossible to access the private field `#value` outside the class and it's also impossible to return a new instance.

This problem can be solved by adding another member to the class so the `#value` field could be set outside the constructor.

One approach to solving this problem in the library is to add a `decode` function in the `create` phase (or else just have one decode phase, similarly to encode). The problem is `decode` would need to be recursive, and wouldn't be able to deal with circular references.

Splitting up the decoding process like this lets us avoid that problem.

### Symbol encodings

`preszr` also supports encoding JavaScript [symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) values. Similarly to prototypes, `preszr` knows about all the built-in symbols but you have to tell it about your custom symbols for it to encode them. You can do this by putting them in the `encodings` array:

```typescript
const mySymbol = Symbol("test")
const preszr = new Preszr({
    encodings: [
        mySymbol
    ]
});
```

`preszr` will take the key for that encoding from the symbol's description. If your symbol doesn't have a description or if you have several symbols with the same description, you'll have to supply a full *symbol encoding* object:

```typescript
export interface SzrSymbolEncoding {
    key?: string;
    symbol: symbol;
    metadata?: any;
}
```

For example, like this:

```typescript
const mySymbol2 = Symbol();
const preszr = Preszr({
    encodings: [{
        key: "mySymbol",
        symbol: mySymbol2
    }]
});
```

*Unlike prototypes*, `preszr` will still try to represent symbols it doesn't know. When encoding, they will be marked as unknown symbols and their descriptions will be saved. When decoding, `preszr` will generate a new symbol with a description similar to `preszr unknown symbol X` for each symbol it doesn't recognize.

You might notice that the encoding also had `metadata` property. This is similar to the same property in the prototype encoding, and while you can use it, it's mainly for internal use.

## Debugging, Errors, etc





## In-depth Configuration

`Preszr` supports a few more configuration options. For example, you can specify your own unsupported types. 

1. **unsupported**: A list of prototypes or constructors to unsupport. These are added to the built-in unsupported types and handled the same way.
2. **strict**: Options for making the encoder more strict



```typescript
class Example1 {}
class Example2 {}
const preszr = Preszr({
    unsupported: [
        Example1,
        Example2.prototype
    ]
});
```


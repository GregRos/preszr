# Szr

[![Node.js CI](https://github.com/GregRos/szr/actions/workflows/main.yaml/badge.svg)](https://github.com/GregRos/szr/actions/workflows/main.yaml)
[![Coverage Status](https://coveralls.io/repos/github/GregRos/szr/badge.svg?branch=master)](https://coveralls.io/github/GregRos/szr?branch=master)
[![npm](https://img.shields.io/npm/v/szr)](https://www.npmjs.com/package/szr)

`szr` takes complex objects with meaningful references and prototypes and transforms them into simple objects that can be serialized (using e.g. `JSON.stringify`). 

Features:

* Encodes references, including circular references.
* Can preserve prototype information.
* Encodes almost all primitives and built-in, platform-independent types.

Here is how `szr` is different from some other libraries that do the same thing:

- No schemas or decorators.
- Can be easily configured to encode custom objects in arbitrary ways.

If you're curious about how `szr` works, refer to the *Szr Output* section below.

## Usage

To encode an object, use the `encode` function:

```typescript
import {encode} from "szr";

const original = { /* ... */ }
const encoded = encode(original);
```

The result of `encode` is an array in szr format, or in some cases a primitive. Whatever the result is, it can be serialized using any method that can serialize flat JSON.

After serializing the object and, say, sending it via the network, you'll need to `decode` it to get back the original form.

```typescript
import {decode} from "szr";

const original = decode(encoded);
```

The default `encode` and `decode` functions will work for many objects out of the box, but they can't encode custom prototypes. To do that, you'll need create new `Szr` instance and set the `encodings` array to just contain some constructors:

```typescript
import {Szr} from "szr";

class Example {}
class Exmaple2 {}

// 'new' is optional
const mySzr = Szr({
    encodings: [
        Example,
        Example2
    ]
});
```

That's it. That's all you need to do for `szr` to recognize your prototypes and preserve them.

You need to configure Szr with the same prototype encodings in both the source and the destination, though the order doesn't matter. One way to solve this problem while avoiding code duplication is to distribute a set of custom types together with an `Szr` instance that can serialize them.

## Installing

```
npm install szr
```

Or:

```
yarn add szr
```

## Supported Types

`szr` supports all built-in, platform-independent primitives and objects, except:

1. `function` - outside the scope of this library.

Those are ignored. `szr` also explicitly *unsupports* a few different types

1. `Promise` - Promises are explicitly unsupported 
2. `WeakMap`, `WeakSet`, which can't be serialized.

For example, the following are explicitly supported:

1. `Map`, `Set` collections.

## Custom Prototypes

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

Note that if your constructor is nameless, or some of the constructors you use have the same names, you might have to do some more configuration. See the *encodings* section below.

### Symbols

`szr` recognizes symbols in general and knows about most of the built-in symbols. If you want it to recognize your own symbols, you'll need to supply them to `encodings`, similarly to prototypes.

```typescript
const symbol = Symbol("test")
const szr = new Szr({
    encodings: [
        symbol
    ]
});
```

Just like with prototypes, if your symbol doesn't have a description or if you have several symbols with the same description, you'll have to supply a few more details. See more below.

*Unlike prototypes*, `szr` will still try to represent symbols it doesn't know. When encoding, they will be marked as unknown symbols and their descriptions will be saved. When decoding, `szr` will generate a new symbol with a description similar to `szr unknown symbol X` for each symbol it doesn't recognize, but their identities will be preserved.

## Encodings

`szr` determines how to represent a particular object using an *encoding*. There are two types of encodings:

1. Symbol encodings.
2. Prototype encodings.

Every encoding has a unique `key` that identifies it. In addition to any encodings you provide, every instance of `szr` already includes built-in encodings for all supported prototypes. These have special keys that are unlikely to be duplicated.

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

If you pass a constructor as an encoding, `szr` will generate a complete prototype encoding under the hood. This encoding will:

1. When encoding, use the standard object encoder.
2. When decoding, it will use the standard object decoder and attach the correct prototype. No constructor will be executed.

In general, it will work properly, but in some cases you will need more configuration. The simplest case is if the constructor is nameless or if there are several constructors with the same name. In that case, you will need to supply an object with `key` and `prototype`:

```typescript
const nameless = (class {})

const szr = new Szr({
    encodings: [{ 
        key: "Nameless", 
        prototype: nameless.prototype
    }]
});
```

However, prototype encodings are quite versatile and can do a lot more than this. They are how most of the supported types are implemented, after all. Let's take a look at the interface of the prototype encoding specifier:

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

`szr` will not check your output, so you're responsible for making sure it's valid yourself.

`encode` takes two parameters:

1. The value being encoded, `input`.
2. `ctx`, the encoding context. This is an object that lets you communicate with the encoding process.

For simple objects, there is no need to use `ctx` at all - all you need to generate an encoding of your object is to use `input`. However, `ctx` is important when your object contains other data or references to objects that themselves need to be encoded. To deal with these values, use the function `ctx.encode`.

`ctx.encode` is a kind of recursive call that encodes nested data. Note that it doesn't actually return the output of `szr.encode`.

1. For entities that need to be referenced, such as most objects and symbols, it will encode them, add them to the final output as a side-effect, and return a reference you can plug in the correct location. Note that during this process, encoders will be used - including the one you're writing. Thus this function can end up calling your own `encode` implementation on a different input.
2. For JSON-legal scalars, it will just return the value back.
3. For scalars that aren't JSON-legal, it will return an encoded value.

You shouldn't care what `ctx.encode` returns. Just know that it's a JSON-legal value you can plug wherever it's needed. `szr` takes care of things like type checking for you.

#### Metadata

You can also set `ctx.metadata`. This is a kind of additional return value that will be stored in the szr output. You can use this value later during decoding.

#### Decoder

Unlike encoding, decoding is a two-step process. Here is the type of the decoder:

```typescript
interface Decoder {
    create(encoded: SzrEncodedEntity, ctx: DecodeCreateContext): unknown;
    init?(target: any, encoded: SzrEncodedEntity, ctx: DecodeInitContext): void;
}
```

##### Create

The first step is to create the decoded object. During this part of the process, you can only use the `encoded` parameter and `ctx.metadata`. For some objects, those that don't reference other objects, this is enough.

The return value of the function should be the base form of the object, without any data that needs to be decoded. In many cases, the object will be "broken", such as having a particular prototype but lacking the data necessary to actually function.

##### Init

The second step is to initialize the object you created in the previous step, which is available through the `target` parameter. For simple objects like dates, regular expressions, and binary data this step isn't used at all - all the information they contain is unencoded. However, regular objects arrays need this extra step.

Note that the `init` method shouldn't return anything.

Here `ctx` exposes the member `ctx.decode` which is the reverse of `ctx.encode`. It will resolve references, decode unencoded scalars, and so on. However, there is a caveat - most objects during this stage aren't initialized. That means you shouldn't try to perform operations with objects you get from `ctx.decode`. Just plug the object you receive in the correct place.

#### Example

Take a look at how the `SetEncoding` is implemented in the library, for encoding the JS collection `Set`:

```typescript
export const SetEncoding: SzrPrototypeEncoding = {
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

While this system is flexible enough to work with all sorts of objects, there are objects it can't decode. For example, take the following object, which uses [JS private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields):

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

While `szr` can encode this class (you would need to write a special encoder for it), it can't decode it, as the only way to set the field `#value` is via the constructor. The field might contain an object, so it has to be decoded as well. This raises a problem:

1. During `create`, decoding values isn't available since objects haven't been created yet.
2. During `init`, it's impossible to access the private field `#value` outside the class and it's also impossible to return a new instance.

This problem can be solved by adding another member to the class so the `#value` field could be set outside the constructor.

One approach to solving this problem in the library is to add a `decode` function in the `create` phase (or else just have one decode phase, similarly to encode). The problem is `decode` would need to be recursive, and wouldn't be able to deal with circular references.

Splitting up the decoding process like this lets us avoid that problem.

## Szr Output

The *szr output* is the result of encoding a value using `szr`. If used to encode primitives other than strings, symbols, and functions, it will return a single value:

1. For JSON-legal primitives, it will return the value unchanged.
2. For other primitives it will return an encoded value, usually a string of some sort.

For example, encoding a `bigint` returns the string `B${n}`. Other inputs, including objects, strings, and symbols, will return an array in the *szr format*. These inputs are also known as *entities* in the context of this library.

### Szr Format

The *szr format* is an array as follows:

```typescript
[header, szrData1, szrData2, szrData3, ...]
```

The first element of the array is always the *header*, which contains version and encoding information. All the other elements are the results of applying an encoding on an *entity*.

While encoding a value `szr` will encode its contents recursively. Each entity encoded in this way will be added to the end of the array, so that the final result will contain all encoded entities in the order of appearance.

When an entity is encoded using the `ctx.encode` function, it will return an *szr reference* to the entity, which is just a numeric string that is the index of the encoded entity in the array, e.g. `"1"`, `"2"`, etc. Note that because the first element is always the header, `"0"` doesn't correspond to anything.

The exact format of an szr encoded entity varies depending on the encoding:

1. **An object** - An object with all its property values encoded using `ctx.encode`. Non-entity values remain as-is. Objects with symbol properties have a more complex encoding.
2. **An array** - An array with its elements encoded using `ctx.encode`. Sparse arrays and arrays with string object keys are encoded like objects.
3. **A string** - No special representation. Strings are treated as entities because otherwise it would be harder to implement references, encoded values, and so on. This also reduces the payload size since identical strings only need to appear once in the output.
4. **A symbol** - 0. The identity of the symbol is the encoding itself, which is part of the header.

### Header Structure

The header contains information about how the data was encoded. Its format is as follows:

```javascript
[majorVersion, encodingKeys, encodingInformation, metadata]
```

#### Major Version

The major version of the package, as a string. You can only decode *szr format* messages encoded by the same major version.

#### Encoding Keys

An array of the keys of all the encodings used by this message. For example:

```typescript
["Type1", "Type2", "Symbol1"]
```

#### Encoding Specification

Each key is an *szr reference* of an encoded entity and its value is the encoding it uses - as an index into the *encoding keys* array above. For example:

```typescript
{
    "1": 0,
    "2": 1
}
```

#### Metadata

Metadata is used to store extra information about an encoded entity. Its format is similar to encoding information, in that every key is an szr reference, but they can have any JSON-legal value.

```typescript
{
    1: true,
    2: {text: "hello"}
}
```

Metadata doesn't do anything unless an encoding explicitly uses it.

### Example

Here is the output of a big object with lots of different values:

```javascript
[
  [
    '1',
    [
      '!@#szr-Uint8Array',
      '!@#szr-Error',
      '!@#szr-null',
      '!@#szr-Map',
      '!@#szr-Set',
      '!@#szr-Date',
      '!@#szr-RegExp'
    ],
    { '3': 0, '4': 1, '8': 2, '9': 3, '10': 4, '12': 5, '13': 6 },
    {}
  ],
  {
    boolean: true,
    number: 1,
    nonJsonNumber: 'Infinity',
    string: '2',
    alsoString: '2',
    undefined: '-',
    null: null,
    bigint: 'B1000000000000000000000000',
    binary: '3',
    error: '4',
    nullProtoObject: '8',
    map: '9',
    set: '10',
    array: '11',
    date: '12',
    regexp: '13',
    ref1: '14',
    ref2: '14'
  },
  'hello',
  'AQIDBA==',
  { stack: '5', name: '6', message: '7' },
  'Error: (stack trace)',
  'Error',
  '',
  { value: 5 },
  [ [ 1, 1 ] ],
  [ 5 ],
  [ 1 ],
  1625164936110,
  [ 'abc', 'gi' ],
  {}
]
```


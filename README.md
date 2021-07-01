# Szr
[![Node.js CI](https://github.com/GregRos/szr/actions/workflows/main.yaml/badge.svg)](https://github.com/GregRos/szr/actions/workflows/main.yaml)
[![Coverage Status](https://coveralls.io/repos/github/GregRos/szr/badge.svg?branch=master)](https://coveralls.io/github/GregRos/szr?branch=master)
[![npm](https://img.shields.io/npm/v/szr)](https://www.npmjs.com/package/szr)

`szr` is a lightweight library for encoding complex objects so they can be serialized. Written in TypeScript.

The encoding `szr` uses creates a simple JSON output that describes objects, references between those objects, their prototypes, and so on. You can send this output over the network and use `szr` to reconstruct the original object at the destination, attaching the correct prototype if it has been configured. `szr` also handles circular references.

For more information about how `szr`represents objects, see about the *szr format* below.

`szr` supports almost all platform-independent objects out of the box and can be easily configured to support your own. It's highly customizable.

Szr does not use decorators or schemas. It's a lot simpler than that.

## Installing

First, install the package.

```
yarn add szr
```

Or:

```
npm install szr --save
```

## Example

```javascript
import {decode, encode} from "szr";


test("simple object", t => {
    const obj2 = {};
    const obj = {
        boolean: true,
        number: 1,
        nonJsonNumber: Infinity,
        string: "hello",
        alsoString: "hello",
        undefined,
        null: null,
        bigint: BigInt("1000000000000000000000000"),
        binary: new Uint8Array([1, 2, 3, 4]),
        error: new Error(),
        nullProtoObject: Object.create(null, {
            value: {
                value: 5,
                enumerable: true
            }
        }),
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

See more examples [here](https://github.com/GregRos/szr/blob/master/src/test/standard.spec.ts).

## Supported Types

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
  * Note that by default only enumerable keys are used.
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

The following are explicitly unsupported and handled gracefully:

* Functions.
* `WeakMap` and `WeakSet`.

Other limitations:

* Right now, `szr` doesn't encode control characters in strings. These are characters like `\x00` NUL that can appear in JavaScript strings but not JSON strings. This is unlikely to come up.
* No support for `BigInt64Array` and its counterpart.
* No special treatment of iterators.

## Usage

The `szr` package exposes three main members.

### `encode`

Encodes an object using default settings. Uses only built-in encodings.

```javascript
import {encode} from "szr";

const result = encode(someObject);
```

Note that objects encoded with a specific major version of the package can't be decoded by any other version.

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
    ]
});

const encoded = szr.encode(someObject);
const decoded = szr.decode(encoded);
```

You need to make sure `szr` is configured with the same `encodings` in both the source and the destination. The order doesn't matter though.

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

*Unlike with prototypes*, `szr` will still try to represent symbols it doesn't know. When encoding, they will be marked as unknown symbols and their descriptions will be saved. When decoding, `szr` will generate a new symbol with a description similar to `szr unknown symbol X` for each symbol it doesn't recognize.

## Encodings

`szr` determines how to represent a particular object using an *encoding*. There are basically two types of encodings:

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

In general, it will work properly, but in some cases you will need more configuration. The simplest case is if the prototype is nameless or if there are several prototypes with the same name. In that case, you will need to supply an object with `key` and `prototype`:

```typescript
const szr = new Szr({
    encodings: [
        { 
            key: "Event", 
            prototype: Event.prototype
        }
    ]
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

Note that instead of the `prototype` property, you can supply `prototypes` instead - an array of multiple prototypes that will use the same encoding. If you do this, you will need to specify *all* the properties of the encoding as none will be filled in for you. There is generally little reason to do this. It's mainly used internally.

#### Encode

The signature of this function is as follows:

```typescript
(input: any, ctx: EncodeContext) => SzrEncodedEntity;
```

This function should return simple data that can be represented in JSON. So that means:

1. JSON-compatible scalars, like numbers, strings, and so on.
2. Simple objects and arrays.

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
    create(encoded: SzrEncodedEntity, ctx: DecodeCreateContext): any;
    init?(target: any, encoded: SzrEncodedEntity, ctx: DecodeInitContext): void;
}
```

##### Create

The first step is to create the decoded object. During this part of the process, you can only use the `encoded` and `ctx.metadata`. For some objects, those that don't reference other objects, this is enough.

The return value of the function should be the base form of the object, without any data that needs to be decoded. In many cases, the object will be "broken", such as having a particular prototype but lacking the data necessary to actually function.

##### Init

The second step is to initialize the object you created in the previous step, which is available through the `target` parameter. For simple objects like dates, regular expressions, and binary data this step isn't used at all - all the information they contain is unencoded. However, regular objects arrays need this extra step.

Note that the `init` method shouldn't return anything.

Here `ctx` exposes the member `ctx.decode` which is the reverse of `ctx.encode`. It will resolve references, decode unencoded scalars, and so on. However, there is a caveat - most objects during this stage aren't initialized. That means you shouldn't try to perform operations with objects you get from `ctx.decode`.

#### Example

Take a look at how the `SetEncoding` is implemented in the library.

```typescript
export const SetEncoding: SzrPrototypeEncoding = {
    prototypes: [Set.prototype],
    key: getLibraryString("Set"),
    encode(input: Set<any>, ctx: EncodeContext): SzrEncodedEntity {
        const outArray = [] as SzrLeaf[];
        for (const item of input) {
            outArray.push(ctx.encode(item));
        }
        return outArray;
    },
    decoder: {
        create(): any {
            return new Set();
        },
        init(target: Set<any>, encoded: SzrLeaf[], ctx: DecodeInitContext) {
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

As we discussed earlier, while encoding a value `szr` will encode its contents recursively. Each entity encoded in this way will be added to the end of the array, so that the final result will contain all encoded entities in the order of appearance.

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

Here is the input and output for the example object shown at the start of this document.

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


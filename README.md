# Szr

A lightweight library for encoding complex objects with references as simple JSON objects so they can be serialized. It also supports encoding type information, restoring an object's prototype after it has been decoded, and custom encodings in general. Szr does not use decorators or schemas.

For information about how szr encodes objects, see *szr representation* below.

For example, this library can encode the object `obj` so that it can be serialized, sent over the network, and then deserialized at the destination.

```javascript
import {encode} from "szr";

const obj = {};
const b = {
    int: 1,
    bool: true,
    obj
};
const c = {
    obj,
    b
};
obj.b = b;
obj.c = c;
const encoded = JSON.stringify(encode(obj));
```

Szr has support for all JavaScript primitives.

* strings
* undefined
* null
* numbers
* boolean
* symbols*

And many built-in objects:

* Plain objects and arrays
* Sparse arrays, arrays with string keys
* Objects with symbol keys
* Regular expressions
* Date
* Collections
  * Set
  * Map
* Binary data
  * ArrayBuffer
  * TypedArray
  * etc
* The object versions of primitives: Number, String, etc.

\* Using symbols requires configuration. By default they are ignored.

The following aren't supported:

* <s>functions</s>

## Usage

The `szr` package exposes three members.

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

A encoder and decoder class. Use this to encode and decode objects using custom encoding.

```typescript
import {Szr} from "szr";
const szr = new Szr({
	// Options, type information, etc
});
const encoded = szr.encode(someObject);
const result = szr.decode(encoded);
```

## Classes and custom encodings

Szr supports custom encodings.

The simplest use of this feature lets `szr` set prototype of an object during decoding. However, it can also be used to initialize objects and to encode objects using entirely custom logic.

For `szr` to set the prototype of an object, it needs to know about. You can tell `szr` about it by specifying the class/constructor in the `encodings` property:

```typescript
import {Szr} from "szr";
class A {}
class B {}
class C extends B {
    constructor(x) {
        this.x = x;
    }
}
const szr = new Szr(
	encodings: [
	    A,
    	B
    ]
)
```

When set up like this, `szr` will encode instances of `A` and `B` so that when decoded, they will have the same prototype. Note that you need to specify the *exact* constructor of the object. This `Szr` instance won't recognize instances of `C`, even though it's a subtype of `B`.

By default, `szr` will decode an object with a known prototype by using the standard object decoder and then modifying its prototype using `Object.setPrototypeOf` - the class constructor won't actually be called. However, some objects need their constructor to be called in order to work correctly. You can write code to do this by providing a complete encoding object.

An encoding object has the interface:

```typescript
export interface SzrPrototypeEncoding {
    // The constructor - specify this or prototype, not both.
    clazz?: Function;

    // The prototype - specify this or class, not both.
    prototype: object;

    // The key that identifies this encoding. Must be unique.
    key: string;
    
    // Called to decode objects with the specified prototype. If not provided,
    // objects will be decoded using the standard object decoder and then their
    // prototype will be modified using `Object.setPrototypeOf`.
    // You usually need this if you want the class constructor to be called
    // during decoding, or if you're using custom encoding logic.
    decode(input: any, ctx: DecodeContext): any;

    // Called to encode objects with the specified prototype. If not provided,
    // objects will be encoded using the standard object encoding.
    // You usually only need this to encode special objects, like collections.
    encode(input: any, ctx: EncodeContext): any;
}
```

Usage example:

```javascript
const szr = new Szr({
    types: [{
        prototype: C.prototype,
        from(input) {
            return new C(input.x);
        },
        key: "custom-key"
    }]
});
const encoded = szr.encode(new C("a"));
const decoded = szr.decode(serialized);
```

It is valid to encode an object with a `null` prototype.

## Szr Output

This section describes how `szr` encodes entities. The szr output can change if the package major version changes.

An *entity* is one of the following:

1. An object.
2. An array.
3. A string.
4. A symbol (requires configuration).

The *szr output* is a single array:

```typescript
[metadata, szrData1, szrData2, szrData3, ...]
```

The first element of the array is always the *metadata array*, which contains version and encoding information. The next element is the *szr representation* for the entity being encoded.

When encoding an entity, `szr` will recursively traverse it, adding the entities it references to the output and replacing them with *szr references* to those entities. An *szr reference* is simply `"${i}"` which `i` is the index of the entity in the array, e.g. `"1"`, `"2"` and so forth. Note that because the first element is always the metadata array, `"0"` doesn't correspond to any entity. Instead, it encodes `undefined`.

The exact *szr representation* of an entity depends on the encoding used. Here are representations for common entities.

1. **An object** - An object, with all references to entities replaced by *szr references*. Non-entity values remain as-is. Objects with symbol properties are handled differently.
2. **An array** - An array, with all entity elements replaced by *szr references*. Sparse arrays and arrays with string keys are handled differently.
3. **A string** - No special representation. Strings are treated as entities so that they aren't confused with szr references.
4. **A symbol** - 0. The identity of the symbol is stored as metadata.

`szr` determines which encoding to use based on the entity's type and prototype (and a few other rules). 

### Encoding numeric values

Some numeric values are valid in JavaScript but not in JSON. These values are specially encoded.

1. `Infinity` is encoded as `"Infinity"`.
2. `-Infinity` is encoded as `"-Infinity"`.
3. `-0` is encoded is `"-0"`.
4. `NaN` is encoded as `"NaN"`.
5. 

### Metadata Array

The metadata array contains information about how the data was serialized. Its format is as follows:

```javascript
[majorVersion, encodingInformation?, customMetadata?]
```

#### Encoding Information

The encoding information is an object where the keys are szr references and the values are encoding keys. For example:

```typescript
{
	"1": "Type1",
	"2": "Type2",
    "3": "symbol1"
}
```

In some cases, built-in encodings won't embed any type information. For example, plain arrays, objects, and strings won't embed any type information. In this case, the library will infer the right encoding to use.

If there is no encoding information, this object will be 

#### Custom Metadata

Custom metadata is an object used to store extra data during encoding. For example, `szr`'s built-in array encoding uses this feature to mark sparse arrays for special handling.

### Encoding non-entities

You can also encode non-entities using `szr` directly:

1. numbers
2. booleans
3. `null`
4. `undefined`

`undefined` is encoded as `"0"`. The rest are encoded as themselves.

### Example Output

Here is a complete 




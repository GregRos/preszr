# preszr

[![Node.js CI](https://github.com/GregRos/preszr/actions/workflows/main.yaml/badge.svg)](https://github.com/GregRos/preszr/actions/workflows/main.yaml)
[![Coverage Status](https://coveralls.io/repos/github/GregRos/preszr/badge.svg?branch=master)](https://coveralls.io/github/GregRos/preszr?branch=master)
[![npm](https://img.shields.io/npm/v/preszr)](https://www.npmjs.com/package/preszr)

`preszr` is a *pre-serialization* JavaScript library that allows you to serialize objects with meaningful references and [prototypes](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes). In other words, it's for encoding [object graphs](https://stackoverflow.com/a/2046774). 

Here's is how you'd use it:

1. Take <a href="docs/">any value</a> and *encode* it with `preszr`, giving you a [preszr message](docs/format.md).
2. You can take that array and *serialize* it with [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), or anything else that can serialize JS objects, like [BSON](https://www.mongodb.com/basics/bson).
3. You send it via the network or maybe save it to file.
4. At the other end (in time or space), you first *deserialize* the data using `JSON.parse` or whatever you used.
5. Then you *decode* it using `preszr`. 
6. Now you have your thing back, with all its references and prototypes and everything (if any).

There's a library called [preserialize](https://preserialize.readthedocs.io/en/latest/) for python that does something similar, but `preszr` isn't related to it.

## Features

🔗 Preserves references and prototypes!

🐐 Encodes <a href="docs/supported.md">all the relevant data types</a> as of 2022!

🐤 Space-efficient format!

🛠️ Super easy to encode custom types!

💾 Basic versioning! 

🌍 Should work in all standard JS environments!

## Non-features

🚫 Doesn't require schemas or decorators¡

🔒 Doesn't require executing generated code¡

🛡️ Doesn't modify the input¡

## Use cases

All those emojis sure look nice, but when would you actually want to use `preszr`? Normally you'd want to keep communication between things as simple as possible to avoid tight coupling.

Normally, yes. But sometimes things are not normal. For example;

* You're hacking something together and just want objects to appear at the other end.
* If your data is an object-graph, like if it's a decision tree, workflow, etc.
* Things are already tightly coupled so there is no use trying to minimize it. Maybe it's even deliberate.

## Usage

`preszr` exports three things:

```javascript
import { encode, decode, Preszr } from "preszr";
```

`encode` will encode your thing into a *preszr message*:

```javascript
const yourThing = {
    a: new Uint16Array([1, 2, 3]),
    b: undefined,
    c: []
};
const encoded = encode({
    a: new Uint16Array([1, 2, 3])
});

// Serializing the message:
const serialized = JSON.stringify(encoded);

// Sending it:
websocket.send(serialized);
```

`decode` will do the opposite:

```javascript
websocket.on("message", event => {
    const data = event.data;
    
    // Deserializing:
    const deserialized = JSON.parse(data);
    
    // Decoding:
    const decoded = decode(deserialized);
    
    // Got your thing back!
    expect(decoded).toEqual(yourThing);
})
```

The default functions will work for most objects - for example:

* `Date`
* `ArrayBuffer`
* `BigInt64Array` (if present in the environment)
* References, circular or otherwise

Or, more generally, any platform-independent, built-in object that's not [explicitly unsupported](docs/supported.md),

What about other object types, though? Let's take a real-world example.

```javascript
class UhhNumber {
	constructor(value) {
        this.value = value;
    }
    
    plus(other) {
        return new UhhNumber(this.value + other.value);
    }
    
    valueOf() {
        return this.value;
    }
}
```

Say you wanted `preszr` to encode one of those. You just create a new `Preszr` instance and give it the constructor, like this:

```javascript
// 'new' is actually optional.
const myInstance = new Preszr({
    encodes: [UhhNumber]
})
```

And that's it. `myInstance` can now encode an `UhhNumber`!

## Installing

```bash
npm install preszr
```

Or:

```bash
yarn add preszr
```

# Custom encodings

To encode objects, `preszr` uses objects called *encodings*.

Nice, right? Anyway, here is what they look like:

```javascript
{
    // What it encodes
	encodes: UhhNumber
    
	// A name. Can be usually be inferred.
	name: "NumberOrSomething"
    
    // A version. Defaults to 1.
   	version: 1,
    
    // Encoding logic. Has a generic default.
    encodes(/* LATER */) { /* LATER */ },
        
    // Decoding logic. Has a generic default.
	decoder: {
        create(/* LATER */) { /* LATER */ },
        init(/* LATER */) { /* LATER */ }
    }
}
```

These objects go into the `encodes` property of the `Preszr` object. When you put a constructor in there, `preszr` will just generate a complete encoding behind the scenes, inferring or using defaults for everything except the `encodes` property (which is required).

Sometimes, like if `preszr` can't infer the name, it will error during configuration and tell you about it. In that case, you'll need to replace the constructor with a simple encoding object, like this:

```typescript
const namelessClass = (class {});

// throws PreszrError(config/spec/proto/no-name): 
// Couldn't get the prototype's name. Add a 'name' property:
let preszr = Preszr({
    encodes: [namelessClass]
});

// Doesn't throw:
preszr = Preszr({
    encodes: [{
        encodes: namelessClass
        name: "NamelessClass"
    }]
})
```



When encoding, `preszr` will use the encoding of the closest known prototype of an object, possibly down to `Object.prototype` if it doesn't find anything.

Besides the prototype, encodings have a few more properties:

* Their name. This can usually be inferred from the constructor/prototype.
* Their version, `1` by default. (More on versioning later.)
* Encoding and decoding logic.

When you give `preszr` a prototype or constructor instead of an encoding object, it will just create the encoding object under the hood. In some cases, though, it won't be able to 

The various shorthands (like giving `preszr` the constructor straight away) just create a complete encoding under the hood. 

This is how most built-in objects are encoded, including collections like `Set` and `Map`. You can easily add your own encodings too - they are really easy to write.



When encountering an object, `preszr` will decide which encoding to use 

In the context of `preszr`, an encoding is an object with various properties, including a name and a version,

1. 



. That's just because it doesn't have *encodings* for them. An encoding converts between the object and its *prezr representation* - a flat object that only has JSON-legal values.





An encoding has all the information needed to convert between a regular object and its special preszr representation. The *preszr representation* of an object is any object that

 There is a generic encoder that works for all objects, but there are also encodings that work just for `Set` or `Map`.

But writing an encoding can be both easy and fun!



Preszr gives you a lot of freedom about how to encode objects, but it still gives you the ability to give back control to the library and let it continue from where you left off.

But say, you had a really special object that needed to be encoded in some different 

The simple examples in the Usage section don't really encodings justice. An **encoding** is an object has:

* A name, which can be inferred.
* A prototype or constructor, which you need to provide.
* f



Encodings let you encode and decode custom objects in arbitrary ways. In fact, `preszr` uses the same system and API to encode built-in objects like `Set` and `Map`, without breaking any rules or using any secret APIs. 

Every encoding has a unique string `key` that identifies it. Usually, the format of this key will be:

```javascript
`${FAMILY}${ENCODING_NAME}.v${ENCODING_VERSION}`
```

The *FAMILY* part is usually a namespace-like category that's shared by several encodings. For example, built-in encodings are of the `Preszr/` family. The slash is optional but pleasing. You can override built-in encodings if you like, but we'll talk about that in the versioning section.

Each encoding is also linked to a prototype, and it's the only 

While encoding, when `preszr` encounters an object, it will descend to its closest known prototype and encode the object with the encoding for that type. This can mean descending down to `Object.prototype` (with normal objects).

When encoding an object with a prototype it doesn't know, `Preszr` will descend to the closest prototype it *does* know, possibly all the way down to `Object.prototype`.

`preszr` will only look at *own* and *enumerable* keys, so it won't be bothered by things like methods, getters, and setters. Those are usually defined on the prototype.

### Prototype encoding

A *prototype encoding* lets `preszr` know how to encode and decode objects with specific prototypes. This only applies to proper objects - strings and the like are handled separately.

If you pass a constructor as an encoding, `preszr` will generate a complete prototype encoding under the hood. This encoding will:

1. When encoding, use the standard object encoder.
2. When decoding, it will use the standard object decoder and attach the correct prototype. Importantly, the constructor won't actually be executed.

In general, it will work properly, but in some cases you will need more configuration. Like if the constructor is nameless or if there are several constructors with the same name. In that case, you will need to supply an object with `name` and `encodes` instead:have a prototype and don't have a constructor at all, you'll need to use this format too and `name` will also be mandatory (unless `preszr` manages to guess it).

```javascript
const parent = {};
const child = Object.create(child);

const preszr = Preszr([{ 
    name: "Nameless", 
    encodes: parent
}]);
```

`preszr` will figure out if you gave it a constructor or a prototype.

However, encodings are quite versatile and can do a lot more than this. Let's take a look at the `PrototypeSpecifier`, which is the object you use to describe your cool new encoding. 

```typescript
export interface PrototypeSpecifier {
    name?: string | null;
    
    version?: number;

    encodes: object | Function;

    decoder?: Decoder;

    encode?(input: any, ctx: EncodeContext): EncodedEntity;
}
```

This is the interface `name` and `encodes` belong to. Note that `encodes` does indeed take a function or any other object. Ignore the `version` for now, we'll get into that later. More to the point, this interface has all the bits needed to encode and decode objects.

#### Encode

The signature of this function is as follows:

```typescript
(input: any, ctx: EncodeContext) => EncodedEntity;
```

This function can return any JSON-legal object or value, such as:

1. `"abc"`
2. `12345`
3. `null`
4. `{a: 1234}`
5. `[1, 2, 3]`

`preszr` won't check your output for performance reasons, so returning weird things will cause weird behavior.

`encode` takes two parameters:

1. The value being encoded, `input`.
2. `ctx`, the encoding context. This lets you communicate with the encoding process.

For simple objects that don't have references, you don't need to use `ctx` at all - you only need the `input` itself. If your object does have reference to other objects, though, you'll need to call `ctx.encode` on those objects so they can, too, be correctly encoded.

`ctx.encode` is a recursive call that gives control back to the encoding process. Note that it doesn't return the result of `Preszr.encode` or something. Instead:

1. For things that need to be referenced, such as most objects and symbols, it will encode them, add them to the final result, and return a reference you can plug in the correct location.

   During this process encoders will be used - including the one you're writing. Thus this function can end up calling your own `encode` implementation on a different input.

2. For JSON-legal scalars, it will just return the value back.

3. For scalars that aren't JSON-legal, it will return an encoded value.

You shouldn't care what `ctx.encode` returns. Just know that it's a JSON-legal value you can plug wherever it's needed. `preszr` takes care of things like type checking for you.

For example, let's say we're writing an encoding for the [JavaScript `Map` object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map). That encoding is built-in, but whatever. 

We first need to decide how to encode an object, but in this case the answer is pretty simple - we can just use an array of tuples, like this:

```typescript
function encode(input, ctx) {
    const outArray = [];
    for (const [key, value] of input) {
        outArray.push([ctx.encode(key), ctx.encode(value)]);
    }
    return outArray;
}
```

As you can see, it's really simple, boilerplate code.

##### Metadata

The `encode` function can also set `ctx.metadata`. This is an extra return value that will be stored by `preszr`. You can use it later during decoding. Its existence is not necessary, since you could store this data in the encoded object in some way, but this lets you encode things as arrays or even scalars, while storing extra data about them.

`metadata` can be any JSON-legal object or value.

#### Decoder

Unlike encoding, decoding is a two-step process. Here is the type of the decoder:

```typescript
export interface Decoder {
    // Creates an instance of the entity without referencing any other encoded entities.
    create(encoded: EncodedEntity, ctx: CreateContext): unknown;

    // Fills in additional data by resolving references to other entities.
    init?(target: unknown, encoded: EncodedEntity, ctx: InitContext): void;
}
```

Now let's break it down.

##### CREATE

```typescript
// Creates an instance of the entity without referencing any other encoded entities.
function create(encoded: EncodedEntity, ctx: CreateContext): unknown;
```

The first step is to create the decoded object. At this stage you can only use the `encoded` parameter and the `ctx.metadata` value we talked about earlier. There is no `ctx.decode` or similar here, and you can't decode anything at this stage.

After all that's done you just return it. The object will probably be broken, such as having a particular prototype but lacking the data to actually function. That's totally fine and expected.

The `create` function for our `Map` encoding will look like this:

```javascript
function create(encoded, ctx) {
    // We just need to create an object with the right prototype. 
    // That's it. Maps don't have anything that needs to be configured
    // during construction.
    
    return new Map();
}
```

Maps obviously keep references to other objects, though, so we'll need to go to the next stage.

##### INIT

```javascript
// Fills in additional data by resolving references to other entities.
function init(target: unknown, encoded: EncodedEntity, ctx: InitContext): void;
```

The second step is to initialize the object you created in the previous step and decode any nested data. The result of the previous step is available via the `target` parameter. 

During this step, you can use the method `ctx.decode`. It's the reverse of `ctx.encode` from earlier. It will resolve references, decode encoded scalars, and so on. 

Here is an example of the `init` function for the `Set` decoder:

```javascript
function init(target, encoded, ctx) {
    // 1. target will be a Set, since that's what we created in the previous step.
    // 2. encoded is the encoded value, a simple array, like we decided on earlier.
    
    // Here is what we need to do do initialize the Set:
    for (const x of encoded) {
        target.add(ctx.decode(x));
    }
    
    // Note that this function doesn't return anything.
}
```

Some warnings though:

**During this stage objects are still broken**, so you shouldn't go around calling their methods and manipulating them like normal objects. Just plug them in the right place and that's it.

**`init` doesn't return anything.** If you find yourself needing to return something, you probably made a mistake somewhere or your object can't be encoded using `preszr`. The method acts through side-effects.

#### It's not perfect

This system is flexible enough to work with almost all objects but there are objects it can't decode. For example, take the following object, which uses [JS private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields):

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

1. During **CREATE**, decoding values isn't available since objects haven't been created yet.
2. During **INIT**, it's impossible to access the private field `#value` outside the class and it's also impossible to return a new instance.

This is an inherent problem with any decoding system and it doesn't have a good solution. In this case, you can avoid it by changing the code of the class, but in some JS environments you'll find objects that can't be serialized with `preszr` due to this kind of problem.

### Symbol encodings

`preszr` also supports encoding JavaScript [symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) values. Similarly to prototypes, `preszr` knows about all the built-in symbols but you have to tell it about your custom symbols for it to encode them. You can do this by putting them in the same list as the prototypes:

```typescript
const mySymbol = Symbol("test")
const preszr = new Preszr([mySymbol]);
```

`preszr` will take the key for that encoding from the symbol's description. If your symbol doesn't have a description or if you have several symbols with the same description, you'll have to supply a full *symbol specifier* object:

```typescript
export interface SymbolSpecifier {
    name: string;
    encodes: symbol;
}
```

For example, like this:

```typescript
const mySymbol2 = Symbol();
const preszr = Preszr([{
    name: "mySymbol",
    encodes: mySymbol2
}]);
```

`preszr` will still try to represent symbols it doesn't know. When encoding, they will be marked as unknown symbols and their descriptions will be saved. When decoding, `preszr` will generate a new symbol with a description similar to `preszr unknown symbol X` for each symbol it doesn't recognize.

## Versioning

Preszr is designed to handle basic versioning well, so let's look at its versioning system.

Firstly, 

Preszr supports basic versioning for your custom encodings. Built-in encodings are not versioned - in fact, a breaking change in a built-in encoding will *always* involve a major version change.

Versioning only works with prototype encodings and allow you to enhance the encoding while still being able to read older formats. To do this, simply add several encodings with the same `name` but different versions:

```typescript
class ExampleVersionedClass {}

const preszr = Preszr([
    {
        name: "example",
        version: 1,
        encodes: ExampleVersionedClass
    },
    {
        name: "example",
        version: 2,
        encodes: ExampleVersionedClass
    }
]);
```

The minimum version is $1$ and the maximum version is $999$.
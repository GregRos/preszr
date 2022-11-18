# preszr

[![Node.js CI](https://github.com/GregRos/preszr/actions/workflows/main.yaml/badge.svg)](https://github.com/GregRos/preszr/actions/workflows/main.yaml)
[![Coverage Status](https://coveralls.io/repos/github/GregRos/preszr/badge.svg?branch=master)](https://coveralls.io/github/GregRos/preszr?branch=master)
[![npm](https://img.shields.io/npm/v/preszr)](https://www.npmjs.com/package/preszr)

`preszr` is a schema-less *pre-serialization* JavaScript library that turns complicated objects with references and prototypes into simple ones that can be serialized. In other words, it's for encoding [object graphs](https://stackoverflow.com/a/2046774) as object trees.

Here's is how you use it:

1. Take <a href="docs/">any value</a> and *encode* it with `preszr`, giving you a [preszr message](docs/format.md).
2. You can take that array and *serialize* it with [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), or anything else that can serialize JS objects, like [BSON](https://www.mongodb.com/basics/bson).
3. You send it via the network or maybe save it to file.
4. At the other end (in time or space), you first *deserialize* the data using `JSON.parse` or whatever you used.
5. Then you *decode* it using `preszr`. 
6. Now you have your thing back, with all its references and prototypes and everything (if any).

`preszr` doesn't use any fancy algorithms, the only magic is in the <a href="docs/format.md">format</a>.

There's a library called [preserialize](https://preserialize.readthedocs.io/en/latest/) for python that does something similar, but `preszr` isn't related to it.

## Features

🔗 Preserves references and prototypes!

🐐 Supports all built-in data types and values as of 2022!<sup>1 </sup>

🐤 Space-efficient format!

🛠️ Super easy to encode custom types, with several layers of customization!

💾 Basic versioning! 

🌍 Should work in all standard JS environments!

<sup>1 </sup><small>All platform-independent, built-in objects and primitives, except for some that are <a href="docs/supported.md">explicitly unsupported</a></small>.

## Use cases

All those emojis sure look nice, but when would you actually want to use `preszr`? Normally you'd want to keep communication between things as simple as possible to avoid tight coupling.

Normally, yes. But sometimes things aren't normal. For example:

* You just want to push your objects through the tubes and have them come out the other end.
* Your data is an object-graph, like if it's a decision tree, workflow, etc.
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

// Serializing the message
const serialized = JSON.stringify(encoded);

// Sending it
websocket.send(serialized);
```
`decode` will do the opposite:

```javascript
websocket.on("message", event => {
    const data = event.data;
    
    // Deserializing
    const deserialized = JSON.parse(data);
    
    // Decoding
    const decoded = decode(deserialized);
    
    // Got your thing back!
    expect(decoded).toEqual(yourThing);
})
```

The default functions will work for most objects - for example:

* `Date`
* `ArrayBuffer`
* `BigInt64Array` (if exists)

Or, more generally, any platform-independent, built-in object that's not [explicitly unsupported](docs/supported.md).

What about other object types, though? Let's take a real-world example.

```javascript
class UhhNumber {
	constructor(_value) {
        this._value = value;
    }
    
    plus(other) {
        return new UhhNumber(this._value + other._value);
    }
    
    valueOf() {
        return this._value;
    }
    
    get value() {
        return this._Value;
    }
}
```

Say you wanted `preszr` to encode one of those. You just create a new `Preszr` instance and give it a config object like this:

```javascript
// 'new' is actually optional.
const prz = new Preszr({
    encodes: [UhhNumber]
})
```

And that's it. `myInstance` can now encode an `UhhNumber`! Here is an example:

```javascript
const recoded = prz.decode(
    prz.encode(new UhhNumber(5))
);

expect(recoded).toBeInstanceOf(UhhNumber);

expect(recoded.value).toBe(5);

expect(
    recoded.plus(recoded)
).toEqual(
    new UhhNumber(10)
);
```

The `Preszr` object is immutable and its configuration can't be modified later.

## Installing

```bash
npm install preszr
```

Or:

```bash
yarn add preszr
```

# Library versioning

`preszr` follows [semver](https://semver.org/), and changes in the format of a *preszr message* will always increment the major version.

To make sure it doesn't decode data incorrectly, `preszr` injects its major version into <a href="docs/format.md">non-trivial *preszr messages*</a>. `preszr` will use that version number to determine if it can decode the message or not. Right now `preszr` will error unless that number is the same, but in the future it might have some fallback.

This is one of the features that allows you to safely write preszr messages to disk.

# Customization

To encode objects, `preszr` uses objects called *encodings*. Here is what they look like:

```javascript
{
    // The thing this encoding is for.
    // A constructor or prototype.
	encodes: UhhNumber
    
	// A name. Can be usually be inferred.
	name: "NumberOrSomething"
    
    // A version. Defaults to 1. We'll talk about these later.
   	version: 1,
    
    // Encoding logic.
    encodes(/* LATER */) { /* LATER */ },
        
    // Decoding logic.
	decoder: {
        create(/* LATER */) { /* LATER */ },
        init(/* LATER */) { /* LATER */ }
    }
}
```

When encoding, `preszr` will use the encoding of the nearest prototype of an object that it knows, possibly down to `Object.prototype` if it doesn't find anything else. You can't have two encodings for the same prototype, unless they're versioned (but we'll talk about versioning later). The same is true for encodings with the same name.

These objects go into the `encodes` property of the `Preszr` configuration object. The order doesn't matter and has no effect. When you put a constructor in there like we did in the Usage section, `preszr` will just generate a complete encoding behind the scenes, inferring or using defaults for everything except the `encodes` property (which is required).

In some cases, like if `preszr` fails to infer the constructor name or there is a collision, you'll need to supply a basic encoding object. It can just include the `name` and `encodes` properties, though:

```typescript
const NamelessClass = (class {});

// throws PreszrError(config/spec/proto/no-name): 
// Couldn't get the prototype's name. Add a 'name' property
let preszr = Preszr({
    encodes: [NamelessClass]
});

// Doesn't throw
preszr = Preszr({
    encodes: [{
        encodes: NamelessClass
        name: "NamelessClass"
    }]
})
```

The default encoding logic is pretty dumb, but it will work for most normal objects. Here is what it does:

*  When encoding, it will copy the object key by key<sup>1</sup> and recursively encode each value.
* When decoding, it will create a new object with the right prototype and then copy the input key by key<sup>1</sup>, decoding its values.

<sup>1</sup><small> Inherited or non-enumerable keys are not copied. Symbol keys are copied though, if they are enumerable.</small>

Some objects can't be encoded like this. For example, `Map` and `Set` use hidden internal data. Some of your objects might too. They also might depend on variables bound to closures or on the phase of the moon. For those objects, you'll need to write custom encoding logic. That's the `encodes` function and the `decoder` object. While you can have neither and just use the default behavior, if you specify one of them you have to also specify the other.

## Encoding

Encoding is done by a single function that looks like this:

```javascript
function encodes(uhhNumber, ctx) {
	return uhhNumber.value;
}
```

This function takes the input (here called `uhhNumber`) and returns a representation of it that consists of only structural data and JSON-legal values. The representation can be anything you choose - an object, a number, a string, and so  on. So the following are all valid representations:

* `"abcd"`
* `null`
* `1500`
* `{ value: 10}`
* `[1]`
* `[[[[[10]]]]]`

The following are not:

* `new Uint8Array()`
* `function () {console.log("hello world")}`
* [`100n`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#description)
* `undefined`
* [`document.all`](https://developer.mozilla.org/en-US/docs/Web/API/Document/all)

Preszr won't check your results, though (for performance reasons), and if you return anything weird it can lead to *undefined behavior*.

Each `encode` function is supposed to only ever encode a single prototype. When it stumbles on some internal value (that of a property, an element of a collection, or something else), it can just give control back so `preszr` can handle encoding it. It does that using the `ctx.encode` method. 

`ctx.encode` is different from the previous functions called `encode` we talked about. It's only for encoding the internals of an object - it doesn't return a *preszr message* or anything like that. 

Instead, it will always return a JSON-legal primitive that you just need to plug in the right place - either the value itself, an encoded string, or a reference (<a href="docs/supported.md">which is also a string</a>).

At any rate, it makes writing an encoding for something extremely simple. Even for a complex object, you just need to figure out how to represent the structure of its internal values.

Let's look at the encoding of [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) as an example:

```javascript
function encode(set, ctx) {
    const result = [];
    for (const item of set) {
        result.push(
            // We don't need to worry about encoding the elements,
            // and just let preszr handle it.
            ctx.encode(item)
        );
    }
    return result;
}
```

It's usually that simple.

`ctx.encode` can recurse - if it needs to encode a value of the type you're encoding down the line, it will call your `encode` function again. 

Calls to `encode` are, in general, hard to predict, so it's important to make sure your `encode` function doesn't cause side-effects or have an internal state.

## Decoding

Decoding is a two-step process:

1. You first **CREATE** the object based on its *preszr representation*, without decoding any internal data.
2. Then you **INIT** it by decoding the internal data and putting it where it belongs.

A *decoder object* is just an object with those functions. However, both are optional.

```javascript
const decoder = {
	create(input) {
		
	},
	init(input, ctx) {
	
	}
}
```

### CREATE

```typescript
// CREATE stage for Set:
function create(encodedInput) {
    return new Set();
}
```

During this stage, you need to return an instance with the correct prototype.

However, you can't decode any internal data that was encoded using `ctx.encode`, since other objects might not have had their **CREATE** step execute, so there is nothing `ctx.encode` can return. 

The result of this stage will be an empty, uninitialized object. It'll have fields that are `undefined`, methods that don't work, etc.

On the other hand, if you don't need to decode internal data (e.g. the object can't have references to other objects), you don't need the next stage at all, and just this function will be enough. One example is `ArrayBuffer`, which is just encoded as a base64 string. 

```javascript
const decoder = {
    create(base64) {
        return base64ToArrayBuffer(base64);
    }
}
```

**If you don't have a `create` method, the object will be created using [`Object.create`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create) and left blank. This will often be enough.**

### INIT

```javascript
// INIT stage for Set:
function init(target, encodedInput, ctx) {
    // We chose our `input` to be an array.
	for (const element of encodedInput) {
    	target.push(
        	ctx.decode(element);
        )
    }
}
```

During this stage, we initialize the object that was created in the **CREATE** stage (which we get through the `target` parameter). This time, we can use the `ctx` we get to decode internal data, much in the same way we did when we were encoding.

`ctx.decode` lets us decode an encoded value. Its input is the output of the `ctx.encode` function we used while encoding. The result will be the proper, decoded form of what you gave it. It will resolve references, decode encoded strings, or (if was JSON-legal in the first place) just return the value is it is.

Unlike `ctx.encode`, `ctx.decode` is not recursive. Objects you get from it will have had their **CREATE** stage execute, but not their **INIT** stage, so they might have properties that are `undefined ` and methods that don't work.

**Your `init` function should not return anything and its return value will be ignored.**

**If you don't have an `init` function, this stage will do nothing.**

### Empty decoders

You can have an empty decoder object, `{}`. An empty decoder object will create the object using `Object.create` and not initialize anything. I don't know why you'd want to do that though. Maybe if you're just testing the encoding part.

### Caveats

`preszr` has a few limitations when it comes to certain objects, however. As an example, let's take the following class that uses 

#### Immutable objects

`preszr` can't decode objects that can only be initialized using a constructor. Let's look at some examples.

This object uses [JS private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields) that can't be modified from outside the class:

```javascript
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

Something similar can be achieved with a closure:

```javascript
function createObject(value) {
    return {
        get value() {
            return value;
		}
    }
}
```

Any decoder will need to decode `value` (since it's internal data that could be an object), but this raises a problem:

1. During **CREATE**, decoding values isn't possible since objects haven't been created yet.
2. During **INIT**, you can't modify `obj.value` and you can't return a new object either. 

In some cases, you can forcibly call the constructor on an existing object, but not in the cases above. `preszr` doesn't allow you to break the laws of JavaScript, so you'll need to change your code if you want to encode these.

#### Objects with stray keys

`preszr` doesn't handle things like `Set` objects with string object keys:

```javascript
Object.assign(new Set(), {
    a: 1
})
```

Seeing it's a `Set`, `preszr` will invoke the set encoding logic, which doesn't look at any keys at all.



## Symbols

`preszr` can also deal with [JavaScript symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), both as values and as object keys. Just like with prototypes, `preszr` knows about all the [built-in symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#static_properties) (though most are not relevant to data), but you'll need to tell it about your custom symbols so it can reproduce them.

To do that, you can just put them in the `encodes` array of the `Preszr` configuration:

```javascript
const mySecretSymbol = Symbol("A secret symbol")
const przWithSymbols = new Preszr({
    encodes: [
        mySecretSymbol
    ]
})
```

This creates a *symbol encoding*, a different type of encoding than we talked about earlier (which was actually a *prototype encoding*). Symbol encodings don't have the features of prototype encodings. Here is what a  complete symbol encoding looks like:

```javascript
const przWithSymbols = new Preszr({
    encodes: [{
        encodes: mySecretSymbol,
        name: "MySecretSymbol"
	}]
)
const symbolEncoding = 
```

Like with prototype encodings, `encodes` is required but `name` can be omitted - that's what happens if you just provide the symbol. In that case, the name is inferred from the symbol description. If the symbol doesn't have a description or if there is a collision, you'll need to provide the property after all.

Symbol encodings go into the same `encodes` array as other encodings.

If `preszr` encounters a symbol it doesn't recognize, it won't ignore it or error. It will instead replace all of its appearances with a stand-in symbol. This is similar to what it does with [unsupported values](docs/supported.md). The symbol's description will be similar to:

```
preszr unrecognized ${description}
```

# Versioning

`preszr`'s internal versioning system for custom encodings has been designed to handle two specific use-cases:

1. Reading legacy data, such as data that was written to disk before a change in your objects was made.
2. Overriding built-in encodings, such as for `Set` and the like.

But first, let's look at how `preszr` manages these versions in general.

### Versions

`preszr` identifies each encoding with an encoding key. For prototype encodings, this key will be a combination of the *name* and *version* of the encoding:

```javascript
`${ENCODING_NAME}.v${ENCODING_VERSION}`
```

The rule is that two encodings with the same *key* can't exist on a `Preszr` object.

* For built-in encodings, the version is always `0`. Instead of using this system, **any change in a built-in encoding will cause a change in the major version of the library.**
* For user-defined encodings, the version defaults to `1`, but can be any positive, [safe](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger#:~:text=A%20safe%20integer%20is%20an,fit%20the%20IEEE%2D754%20representation.) integer.

Another rule is that two encodings with the same name must encode the same prototype.

When `preszr` receives a value to encode, it will encode it using the encoding that has the highest version, noting that version down in the *preszr message*. It won't do this when decoding, though. Instead, `preszr` will try to find a decoder that matches the encoding key exactly. If it can't find, it will throw an error.

This follows the [robustness principle](https://en.wikipedia.org/wiki/Robustness_principle):

> Be conservative in what you send, be liberal in what you accept

It means that you'll be able to read legacy data, but never write it, and updating it is as easy as decoding and then re-encoding it. It was mainly designed this way to make the versioning system as simple as possible, though.

When you version an encoding, there are a few more restrictions you have to follow:

* If you have a versioned encoding, each instance must have the `version` property - it will never be inferred This makes it clear that your encoding is versioned.
* You must also specify the `name` property. This is because a change in your object can cause the inferred name to change.

Versioned encodings still go into the `encodes` list of encodings, in any order, as separate objects. Grouping them together doesn't do anything.

### How a version change would work

When you want to make a change to how your object is encoded while still being able to read old data, you need to do the following:

1. Create a new version of your encoding. Your logic can be as similar or different as you want.
2. If, after the modification, your object needs new or different data, modify each previous version of the encoding you want to support so that it returns a compatible object.

## Overriding a built-in encoding

Versions work the same way for built-in encodings, except that you're not allowed to set their `name` property when you define an override - they're identified uniquely by their prototype, and it would just be confusing.

Built-in encodings will always have the version `0`, so you can start your versions from `1`, but `version` is still required.
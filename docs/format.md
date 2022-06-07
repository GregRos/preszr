# Preszr Output

The *preszr output* is the result of encoding a value using `preszr`. If used to encode an input, it will:

1. For JSON-legal primitives except strings, it will return the value unchanged.
2. For JSON-illegal primitives, it will return an encoded string. For example, encoding a `bigint` returns the string `B${n}`. 

For strings and non-primitives, it will return a *preszr message* - which is an always with a specific format. These inputs are also known as *entities* in the context of this library.

## Preszr messages

Preszr is largely devoted to making decoding and encoding as transparent, efficient, and reliable as possible. The fmessage ormat it uses was designed to accomplish lots of different things.

1. Reduce an object graph into a flat-ish data structure.
2. Make it easy to detect bad inputs.
3. Light encoding for references, since they are very common.
4. No magic properties inside objects passed by the user.
5. Flexible enough to encode *almost all* JS built-ins.
6. Allow custom encodings for user objects.
7. Heavily optimize for encoding built-ins vs custom objects.

The *preszr message* is an array as follows:

```typescript
[header, preszrEntity1, preszrEntity2, preszrEntity3, ...]
```

The first element of the array is always the *header*, which contains version and encoding information. All the other elements are the results of applying an encoding on an *entity*.

While encoding a value `preszr` will encode its contents recursively. Each entity encoded in this way will be added to the end of the array, so that the final result will contain all encoded entities in the order of appearance.

When an entity is encoded using the `ctx.encode` function, it will return an *preszr reference* to the entity, which is just a numeric string that is the index of the encoded entity in the array, e.g. `"1"`, `"2"`, etc. Note that because the first element is always the header, `"0"` doesn't correspond to anything.

When strings appear inside encoded entities, they are *always* encoded scalars or references (if numeric).

The exact format of an preszr encoded entity varies depending on the encoding:

1. **An object** - An object with all its property values encoded using `ctx.encode`. Non-entity values remain as-is. Objects with symbol properties have a more complex encoding.
2. **An array** - An array with its elements encoded using `ctx.encode`. Sparse arrays and arrays with string object keys are encoded like objects.
3. **A string** - No special representation. Strings are treated as entities because otherwise it would be harder to implement references, encoded values, and so on. This also reduces the payload size due to string interning. Common strings will need to appear only once.
4. **A symbol** - 0. The identity of the symbol is the encoding itself, which is part of the header.

## Encoding names and keys

An encoding is identified using its *encoding key*, which is composed of an *encoding name* and a *suffix*.

1. For prototype encodings (which are versioned), the format is `${name}.v${version}`.
2. For symbol encodings, the format is `${name}.S`.

## Header Structure

The header contains information about how the data was encoded. Its format is as follows:

```javascript
[majorVersion, keyList, keyMap, metadata]
```

### Major Version

The major version of the package, as a string. You can only decode *preszr message* messages encoded by the same major version.

### Key List

An array of the keys of all the encodings used by this message. For example:

```typescript
["Type1.v1", "Type2.v3", "Symbol1.S"]
```

Built-in objects have encoding keys, but they will never appear in *preszr messages* for efficiency purposes.

### Encoding Map

Each key is an *preszr reference* of an encoded entity and its value is an index that matches up to the encoding.

```typescript
{
    "1": 5,
    "2": 101,
    "3": 20
}
```

There are two types of indexes:

1. Indexes from $0$ to $99$ are reserved for built-in encodings. The built-in encodings aren't versioned, don't appear in the key list, and their indexes are hard-coded. The index is guaranteed to stay the same for a given major version of `preszr`.
2. Starting with index $100$, the index is an offset into the key list array above. Specifically, index $n$ references encoding $n - 100$.

The key map won't have entries for:

* Regular objects.
* Regular arrays.
* Strings.

Instead, the encoding will be decided implicitly according to the type of the encoded entity.

### Metadata

Metadata is used to store extra information about an encoded entity. Its format is similar to encoding information, in that every key is an preszr reference, but they can have any JSON-legal value.

```typescript
{
    1: true,
    2: {text: "hello"}
}
```

Metadata doesn't do anything unless an encoding explicitly uses it.

While it's always possible to store this data in the encoded entity itself, creating a separate metadata object allows more flexibility in how it is encoded. 

Built-in encodings rarely use this feature.

## Example

Here is the output of a big object with lots of different values:

```javascript
[
  [
    "2",       // Major version
    [],        // Key list (empty)
    {    
      "3": 42, // Key map, uses only built-in encodings
      "4": 76, // Note that for some indexes there is no
      "8": 12, // entry here, since they are implicit.
      "9": 13,
      "10": 14,
      "12": 31,
      "13": 30
    },
    {}
  ],
  {
    "boolean": true,   // Some JSON-legal primitives aren't encoded.
    "number": 1,
    "nonJsonNumber": "Infinity",
    "string": "2",     // This references index #2 in the message.
    "alsoString": "2", // Another reference to the same index.
    "undefined": "-",  // JSON-illegal scalars have special encodings.
    "null": null,
    "bigint": "B1000000000000000000000000", // bigint encoding.
    "binary": "3",     // Binary data is encoded as base64.
    "error": "4",      // Errors have special encodings.
    "nullProtoObject": "8",
    "map": "9",
    "set": "10",
    "array": "11",
    "date": "12",
    "regexp": "13",
    "ref1": "14",
    "ref2": "14"
  },
  "hello",    // This is just the string "hello".
  "AQIDBA==", // Binary data is usually encoded as base64.
  {
    "stack": "5", // This encodes an Error object.
    "name": "6",
    "message": "7"
  },
  "Error...", // Error stack trace.
  "Error",    // Error name.
  "",         // Error message.
  {
    "value": 5
  },
  [
    [            // Maps are encoded as pair lists.
      1,
      1
    ]
  ],
  [              
    5            // Sets are encoded as arrays.
  ],
  [              // Arrays are encoded as arrays without a key mapping
    1
  ],
  1654561825399, // Date objects are encoded as timestamps.
  [
    "abc",       // Regular expressions are encoded as strings or pairs.
    "gi"
  ],
  {}
]

```

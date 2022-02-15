# Szr Output

The *szr output* is the result of encoding a value using `szr`. If used to encode primitives other than strings, symbols, and functions, it will return a single value:

1. For JSON-legal primitives, it will return the value unchanged.
2. For other primitives it will return an encoded value, usually a string of some sort.

For example, encoding a `bigint` returns the string `B${n}`. Other inputs, including objects, strings, and symbols, will return an array in the *szr format*. These inputs are also known as *entities* in the context of this library.

## Szr Format

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

## Header Structure

The header contains information about how the data was encoded. Its format is as follows:

```javascript
[majorVersion, encodingKeys, encodingInformation, metadata]
```

### Major Version

The major version of the package, as a string. You can only decode *szr format* messages encoded by the same major version.

### Encoding Keys

An array of the keys of all the encodings used by this message. For example:

```typescript
["Type1", "Type2", "Symbol1"]
```

### Encoding Specification

Each key is an *szr reference* of an encoded entity and its value is the encoding it uses - as an index into the *encoding keys* array above. For example:

```typescript
{
    "1": 0,
    "2": 1
}
```

### Metadata

Metadata is used to store extra information about an encoded entity. Its format is similar to encoding information, in that every key is an szr reference, but they can have any JSON-legal value.

```typescript
{
    1: true,
    2: {text: "hello"}
}
```

Metadata doesn't do anything unless an encoding explicitly uses it.

## Example

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

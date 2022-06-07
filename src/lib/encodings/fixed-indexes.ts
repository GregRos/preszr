// Fixed indexes for built-in encodings. This makes payloads smaller
// and access a tiny bit faster for them.
export enum FixedIndexes {
    /*** UNSUPPORTED BLOCK */

    // OBJECT BLOCK
    Object = 1,
    Array,
    NullProto,
    Map,
    Set,

    // SCALAR BLOCK
    RegExp = 10,
    Date,
    FundBool,
    FundString,
    FundNumber,

    // BINARY BLOCK
    ArrayBuffer = 20,
    SharedArrayBuffer,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    DataView,
    BigUint64Array,
    BigInt64Array,

    // ERROR BLOCK
    EvalError = 50,
    RangeError,
    ReferenceError,
    TypeError,
    URIError,
    SyntaxError,
    Error,

    // UNSUPPORTED BLOCK
    Function = 70,
    GeneratorFunction,
    Generator,
    Promise,
    WeakSet,
    WeakMap,
    AsyncGenerator,
    AsyncGeneratorFunction,
    FinalizationRegistry,
    AsyncFunction,
    WeakRef,
    MapIterator,
    SetIterator,
    ArrayIterator,
    // UNRECOGNIZED SYMBOL
    UnknownSymbol = 98,
    End = 100
    // Block end marker 100
    // Custom encodings start at index 100.
}

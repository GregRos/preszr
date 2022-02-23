// Fixed indexes for built-in encodings. This makes payloads smaller
// and access a tiny bit faster for them.
export enum Fixed {
    /*** UNSUPPORTED BLOCK */
    Unsupported = 0,

    // OBJECT BLOCK
    Object = 10,
    Array,
    NullProto,
    Map,
    Set,

    // SCALAR BLOCK
    Regexp = 30,
    Date,
    FundBool,
    FundString,
    FundNumber,

    // BINARY BLOCK
    ArrayBuffer = 50,
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
    EvalError = 70,
    RangeError,
    ReferenceError,
    TypeError,
    URIError,
    SyntaxError,
    Error,

    // ... FREE BLOCK 76-99
    End = 100
    // Block end marker 100
}

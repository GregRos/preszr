// This file tries to acquire ctors that might not exist in some environments.

const { errorNoTypeInEnv } = require("./errors");

function missingCtor(name) {
    const f = function (x) {
        throw errorNoTypeInEnv(name);
    };
    Object.defineProperty(f, "name", {
        value: name
    });
    return f;
}

function getSpeculative(name, code, map) {
    // This will violate some CSP directives in browsers, giving false negatives
    // but there is no cross-platform way to run these checks.
    // https://mdn.io/script-src
    try {
        map = map == null ? x => x : map;
        const f = new Function(`return ${code}`);
        return map(f());
    } catch (e) {
        // if it errors, the expression must not be valid in this env
        // or there was a CSP error, in which case I dunno.
    }
    return missingCtor(name);
}

// Node 4.x
const generatorFunction = function* () {};

// Node 4.x
exports._GeneratorFunction =
    Object.getPrototypeOf(generatorFunction).constructor;

// Node 4.x
exports._Generator = Object.getPrototypeOf(generatorFunction()).constructor;

// Node 7.x
/** @type {{new(x): any}} */
exports._AsyncFunction = getSpeculative(
    "AsyncFunction",
    "async function(){}",
    f => f.constructor
);

// Node 8.10
/** @type {{new(x): any}} */
exports._SharedArrayBuffer =
    typeof SharedArrayBuffer !== "undefined"
        ? SharedArrayBuffer
        : missingCtor("SharedArrayBuffer");

// Node 10.x
/** @type {{new(x): any}} */
exports._AsyncGeneratorFunction = getSpeculative(
    "AsyncGeneratorFunction",
    "async function*(){}",
    f => Object.getPrototypeOf(f).constructor
);

// Node 10.x
/** @type {{new(x): any}} */
exports._AsyncGenerator = getSpeculative(
    "AsyncGenerator",
    "async function*(){}",
    f => Object.getPrototypeOf(f()).constructor
);

// Node 10.4
/** @type {(x: any) => any} */
exports._BigInt =
    typeof BigInt !== "undefined" ? BigInt : missingCtor("BigInt");

// Node 10.4
/** @type {{new(x): any}} */
exports._BigInt64Array =
    typeof BigInt64Array !== "undefined"
        ? BigInt64Array
        : missingCtor("BigInt64Array");

// Node 10.4
/** @type {{new(x): any}} */
exports._BigUint64Array =
    typeof BigUint64Array !== "undefined"
        ? BigUint64Array
        : missingCtor("BigUint64Array");

// Node 14.6
/** @type {{new(x): any}} */
exports._WeakRef =
    typeof WeakRef !== "undefined" ? WeakRef : missingCtor("WeakRef");

// Node 14.6
/** @type {{new(x): any}} */
exports._FinalizationRegistry =
    typeof FinalizationRegistry !== "undefined"
        ? FinalizationRegistry
        : missingCtor("FinalizationRegistry");

exports._MapIteratorProto = Object.getPrototypeOf(new Map()[Symbol.iterator]());
exports._SetIteratorProto = Object.getPrototypeOf(new Set()[Symbol.iterator]());

exports._ArrayIteratorProto = Object.getPrototypeOf([][Symbol.iterator]());

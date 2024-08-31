// This file tries to acquire ctors that might not exist in some environments.

import { decode_type_unsupported_in_environment } from "./errors/texts2";
declare interface WeakRef<T> {}
declare const WeakRef: {
    prototype: WeakRef<any>;
    new (value: any): WeakRef<any>;
};

declare interface FinalizationRegistry {}
declare const FinalizationRegistry: {
    prototype: FinalizationRegistry;
    new (cleanup: (held: any) => void): FinalizationRegistry;
};

function missingCtor<AsType>(name: string) {
    const f = function (x: any) {
        throw decode_type_unsupported_in_environment(name);
    };
    Object.defineProperty(f, "name", {
        value: name
    });
    return f as AsType;
}

// Node 8.10
export const _SharedArrayBuffer =
    typeof SharedArrayBuffer !== "undefined"
        ? SharedArrayBuffer
        : missingCtor<typeof SharedArrayBuffer>("SharedArrayBuffer");

// Node 10.4
export const _BigInt =
    typeof BigInt !== "undefined"
        ? BigInt
        : missingCtor<typeof BigInt>("BigInt");

// Node 10.4
export const _BigInt64Array =
    typeof BigInt64Array !== "undefined"
        ? BigInt64Array
        : missingCtor<typeof BigInt64Array>("BigInt64Array");

// Node 10.4
export const _BigUint64Array =
    typeof BigUint64Array !== "undefined"
        ? BigUint64Array
        : missingCtor<typeof BigUint64Array>("BigUint64Array");

// Node 14.6
/** @type {{new(x): any}} */
export const _WeakRef =
    typeof WeakRef !== "undefined"
        ? WeakRef
        : missingCtor<typeof WeakRef>("WeakRef");

// Node 14.6
/** @type {{new(x): any}} */
export const _FinalizationRegistry =
    typeof FinalizationRegistry !== "undefined"
        ? FinalizationRegistry
        : missingCtor<typeof FinalizationRegistry>("FinalizationRegistry");

export const _MapIteratorProto = Object.getPrototypeOf(
    new Map()[Symbol.iterator]()
);
export const _SetIteratorProto = Object.getPrototypeOf(
    new Set()[Symbol.iterator]()
);

export const _ArrayIteratorProto = Object.getPrototypeOf([][Symbol.iterator]());

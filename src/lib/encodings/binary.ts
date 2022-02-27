import { CreateContext, EncodeContext, fixedIndexProp, PrototypeEncoding } from "../interface";
import { getLibraryEncodingName } from "../utils";
import { fromByteArray, toByteArray } from "base64-js";
import { _BigInt64Array, _BigUint64Array, _SharedArrayBuffer } from "../opt-types";
import { Fixed } from "./fixed";

/**
 * A union of all typed array constructors.
 */
export type TypedArrayConstructor = {
    new (buffer: ArrayBuffer): any;
};

export const arrayBufferEncoding: PrototypeEncoding = {
    name: getLibraryEncodingName("ArrayBuffer"),
    version: 0,
    [fixedIndexProp]: Fixed.ArrayBuffer,
    prototypes: [ArrayBuffer.prototype].filter(x => !!x),
    encode(input: ArrayBuffer, ctx: EncodeContext): any {
        const b64 = fromByteArray(new Uint8Array(input));
        return b64;
    },
    decoder: {
        create(encodedValue: string, ctx: CreateContext): any {
            const byteArray = toByteArray(encodedValue);
            return byteArray.buffer;
        }
    }
};

export const sharedArrayBufferEncoding: PrototypeEncoding = {
    name: getLibraryEncodingName("SharedArrayBuffer"),
    version: 0,
    [fixedIndexProp]: Fixed.SharedArrayBuffer,
    prototypes: [_SharedArrayBuffer.prototype],
    encode: arrayBufferEncoding.encode.bind(arrayBufferEncoding),
    decoder: {
        create(encodedValue: string, ctx: CreateContext): any {
            // This is not performant, but it's an uncommon use-case.
            const byteArray = toByteArray(encodedValue);
            const sharedBuffer = new _SharedArrayBuffer(byteArray.byteLength);
            const sharedByteArray = new Uint8Array(sharedBuffer);
            sharedByteArray.set(byteArray, 0);
            return sharedBuffer;
        }
    }
};

export function createBinEncoding(
    index: number,
    ctor: TypedArrayConstructor
): PrototypeEncoding | undefined {
    if (!ctor) return undefined;
    return {
        name: getLibraryEncodingName(ctor.name),
        version: 0,
        [fixedIndexProp]: index,
        prototypes: [ctor.prototype],
        encode(input: InstanceType<TypedArrayConstructor>, ctx: EncodeContext): any {
            return arrayBufferEncoding.encode(input.buffer, ctx);
        },
        decoder: {
            create(encodedValue: any, ctx: CreateContext): any {
                const buffer = arrayBufferEncoding.decoder.create(encodedValue, ctx) as ArrayBuffer;
                return new ctor(buffer);
            }
        }
    };
}

export const typedArrayEncodings = [
    createBinEncoding(Fixed.Uint8Array, Uint8Array),
    createBinEncoding(Fixed.Uint8ClampedArray, Uint8ClampedArray),
    createBinEncoding(Fixed.Uint16Array, Uint16Array),
    createBinEncoding(Fixed.Uint32Array, Uint32Array),
    createBinEncoding(Fixed.Int8Array, Int8Array),
    createBinEncoding(Fixed.Int16Array, Int16Array),
    createBinEncoding(Fixed.Int32Array, Int32Array),
    createBinEncoding(Fixed.Float32Array, Float32Array),
    createBinEncoding(Fixed.Float64Array, Float64Array),
    createBinEncoding(Fixed.DataView, DataView),
    createBinEncoding(Fixed.BigInt64Array, _BigInt64Array),
    createBinEncoding(Fixed.BigUint64Array, _BigUint64Array)
]
    .filter(x => !!x)
    .map(x => x!);

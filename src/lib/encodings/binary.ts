import { CreateContext, EncodeContext, PrototypeEncoding } from "../interface";
import { getLibraryEncodingName } from "../utils";
import { fromByteArray, toByteArray } from "base64-js";
import { _BigInt64Array, _BigUint64Array, _SharedArrayBuffer } from "../opt-types";

/**
 * A union of all typed array constructors.
 */
export type TypedArrayConstructor = {
    new (buffer: ArrayBuffer): any;
};

export const arrayBufferEncoding: PrototypeEncoding = {
    key: getLibraryEncodingName("ArrayBuffer"),
    version: 0,
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
    key: getLibraryEncodingName("SharedArrayBuffer"),
    version: 0,
    prototypes: [_SharedArrayBuffer.prototype],
    encode: arrayBufferEncoding.encode.bind(arrayBufferEncoding),
    decoder: {
        create(encodedValue: string, ctx: CreateContext): any {
            const byteArray = toByteArray(encodedValue);
            const sharedBuffer = new _SharedArrayBuffer(byteArray.byteLength);
            const sharedByteArray = new Uint8Array(sharedBuffer);
            sharedByteArray.set(byteArray, 0);
            return sharedBuffer;
        }
    }
};

export function createTypedArrayEncoding(ctor: TypedArrayConstructor): PrototypeEncoding {
    return {
        key: getLibraryEncodingName(ctor.name),
        version: 0,
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

export const typedArrayCtors = [
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Uint8ClampedArray,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    DataView,
    _BigInt64Array,
    _BigUint64Array
]
    .filter(x => !!x)
    .map(x => x as TypedArrayConstructor);

export const typedArrayEncodings = typedArrayCtors.map(createTypedArrayEncoding);

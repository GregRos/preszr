import { CreateContext, EncodeContext, PrototypeEncoding } from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { fromByteArray, toByteArray } from "base64-js";
import {
    _BigInt64Array,
    _BigUint64Array,
    _SharedArrayBuffer
} from "../opt-types";
import { FixedIndexes } from "./fixed-indexes";
import { defineProtoEncoding } from "./utils";

/**
 * A union of all typed array constructors.
 */
export type TypedArrayConstructor = {
    new (buffer: ArrayBuffer): any;
};

export const arrayBufferEncoding = defineProtoEncoding(
    class ArrayBufferEncoding extends PrototypeEncoding<ArrayBuffer> {
        name = getBuiltInEncodingName("ArrayBuffer");
        version = 0;
        fixedIndex = FixedIndexes.ArrayBuffer;
        encodes = ArrayBuffer.prototype;

        encode(input: ArrayBuffer, ctx: EncodeContext): any {
            const b64 = fromByteArray(new Uint8Array(input));
            return b64;
        }

        decoder = {
            create(encodedValue: string, ctx: CreateContext): any {
                const byteArray = toByteArray(encodedValue);
                return byteArray.buffer;
            }
        };
    }
);

export const sharedArrayBufferEncoding = defineProtoEncoding(
    class SharedArrayBufferEncoding extends PrototypeEncoding<any> {
        fixedIndex = FixedIndexes.SharedArrayBuffer;
        name = getBuiltInEncodingName("SharedArrayBuffer");
        version = 0;
        encodes = _SharedArrayBuffer.prototype;
        encode = arrayBufferEncoding.encode.bind(arrayBufferEncoding);
        decoder = {
            create(encodedValue: string, ctx: CreateContext): any {
                // This is not performant, but it's an uncommon use-case.
                const byteArray = toByteArray(encodedValue);
                const sharedBuffer = new _SharedArrayBuffer(
                    byteArray.byteLength
                );
                const sharedByteArray = new Uint8Array(sharedBuffer);
                sharedByteArray.set(byteArray, 0);
                return sharedBuffer;
            }
        };
    }
);

export function createBinEncoding(
    index: number,
    ctor: TypedArrayConstructor
): PrototypeEncoding<any> | undefined {
    if (!ctor) return undefined;
    return defineProtoEncoding(
        class BinaryTypeEncoding extends PrototypeEncoding<any> {
            fixedIndex = index;
            name = getBuiltInEncodingName(ctor.name);
            version = 0;
            encodes = ctor.prototype;
            encode(
                input: InstanceType<TypedArrayConstructor>,
                ctx: EncodeContext
            ): any {
                return ctx.encode(input.buffer);
            }
            decoder = {
                create(encodedValue: any, ctx: CreateContext): any {
                    const buffer = arrayBufferEncoding.decoder.create(
                        encodedValue,
                        ctx
                    ) as ArrayBuffer;
                    return new ctor(buffer);
                }
            };
        }
    );
}

export const typedArrayEncodings = [
    createBinEncoding(FixedIndexes.Uint8Array, Uint8Array),
    createBinEncoding(FixedIndexes.Uint8ClampedArray, Uint8ClampedArray),
    createBinEncoding(FixedIndexes.Uint16Array, Uint16Array),
    createBinEncoding(FixedIndexes.Uint32Array, Uint32Array),
    createBinEncoding(FixedIndexes.Int8Array, Int8Array),
    createBinEncoding(FixedIndexes.Int16Array, Int16Array),
    createBinEncoding(FixedIndexes.Int32Array, Int32Array),
    createBinEncoding(FixedIndexes.Float32Array, Float32Array),
    createBinEncoding(FixedIndexes.Float64Array, Float64Array),
    createBinEncoding(FixedIndexes.DataView, DataView),
    createBinEncoding(FixedIndexes.BigInt64Array, _BigInt64Array),
    createBinEncoding(FixedIndexes.BigUint64Array, _BigUint64Array)
]
    .filter(x => !!x)
    .map(x => x!);

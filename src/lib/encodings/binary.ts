import {
    CreateContext,
    Decoder,
    EncodeContext,
    Encoder,
    PrototypeEncoding,
    RequirementsContext
} from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { fromByteArray, toByteArray } from "base64-js";
import {
    _BigInt64Array,
    _BigUint64Array,
    _SharedArrayBuffer
} from "../opt-types";
import { FixedIndexes } from "./fixed-indexes";
import { defineProtoEncoding } from "./utils";
import { EncodedEntity } from "../data";

/**
 * A union of all typed array constructors.
 */
export type TypedArrayConstructor = {
    new (buffer: ArrayBufferLike, offset: number, length: number): {
        buffer: ArrayBuffer;
        length: number;
        byteOffset: number;
        byteLength: number;
    };
};
export const arrayBufferEncoding = defineProtoEncoding(
    class ArrayBufferEncoding extends PrototypeEncoding<ArrayBuffer> {
        name = getBuiltInEncodingName("ArrayBuffer");
        version = 0;
        fixedIndex = FixedIndexes.ArrayBuffer;
        encodes = ArrayBuffer.prototype;

        encoder = {
            encode(input: ArrayBuffer, ctx: EncodeContext): any {
                const b64 = fromByteArray(new Uint8Array(input));
                return b64;
            }
        };

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
        encoder = arrayBufferEncoding.encoder;
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
            encoder: Encoder<any> = {
                requirements(input: any, ctx) {
                    ctx.require(input.buffer);
                },
                encode(
                    input: InstanceType<TypedArrayConstructor>,
                    ctx: EncodeContext
                ): any {
                    const ctor = input.constructor as Uint8ArrayConstructor;
                    return [
                        ctx.encode(input.buffer),
                        input.byteOffset,
                        input.length
                    ];
                }
            };
            decoder = {
                create(encodedValue: any, ctx: CreateContext): any {
                    const [buffer, byteOffset, length] = encodedValue;
                    // The buffer is the only problem here, and we made sure it was encoded via
                    return new ctor(
                        ctx.decodeUnsafe(buffer),
                        byteOffset,
                        length
                    );
                }
            };
        }
    );
}

export const dataViewEncoding = defineProtoEncoding(
    class DataViewEncoding extends PrototypeEncoding<DataView> {
        encodes = DataView.prototype;
        name = getBuiltInEncodingName("DataView");
        fixedIndex = FixedIndexes.DataView;
        version = 0;
        encoder: Encoder<DataView> = {
            requirements(input, ctx) {
                ctx.require(input.buffer);
            },
            encode(input: DataView, ctx: EncodeContext): EncodedEntity {
                return [
                    ctx.encode(input.buffer),
                    input.byteOffset,
                    input.byteLength
                ];
            }
        };
        decoder: Decoder = {
            create(encoded: any[], ctx: CreateContext): unknown {
                const [buffer, offset, length] = encoded;
                return new DataView(ctx.decodeUnsafe(buffer), offset, length);
            }
        };
    }
);

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
    dataViewEncoding,
    createBinEncoding(FixedIndexes.BigInt64Array, _BigInt64Array),
    createBinEncoding(FixedIndexes.BigUint64Array, _BigUint64Array)
]
    .filter(x => !!x)
    .map(x => x!);

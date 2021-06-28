import {
    DecodeCreateContext,
    EncodeContext,
    SzrPrototypeEncoding
} from "../szr-interface";
import {getEncodedString} from "../utils";
import {fromByteArray, toByteArray} from "base64-js";
type TypedArrayConstructor =
    Int8ArrayConstructor
    | Int16ArrayConstructor
    | Int32ArrayConstructor
    | Uint8ArrayConstructor
    | Uint16ArrayConstructor
    | Uint32ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor
    | DataViewConstructor;

export const arrayBufferEncoding: SzrPrototypeEncoding = {
    key: getEncodedString("ArrayBuffer"),
    prototypes: [ArrayBuffer.prototype],
    encode(input: ArrayBuffer, ctx: EncodeContext): any {
        const b64 = fromByteArray(new Uint8Array(input));
        return b64;
    },
    decoder: {
        create(encodedValue: string, ctx: DecodeCreateContext): any {
            const byteArray = toByteArray(encodedValue);
            return byteArray.buffer;
        }
    }
}

export function createTypedArrayEncoding(ctor: TypedArrayConstructor): SzrPrototypeEncoding {
    return {
        key: getEncodedString(ctor.name),
        prototypes: [ctor.prototype],
        encode(input: InstanceType<TypedArrayConstructor>, ctx: EncodeContext): any {
            return arrayBufferEncoding.encode(input.buffer, ctx);
        },
        decoder: {
            create(encodedValue: any, ctx: DecodeCreateContext): any {
                const buffer = arrayBufferEncoding.decoder.create(encodedValue, ctx);
                return new ctor(buffer);
            }
        }
    };
}

export const typedArrayEncodings = [
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Uint8ClampedArray,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    DataView   
].map(createTypedArrayEncoding);

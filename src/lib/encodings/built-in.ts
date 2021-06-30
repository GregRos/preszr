import {DecodeCreateContext, DecodeInitContext, EncodeContext, SzrPrototypeEncoding} from "../szr-interface";
import {getLibraryString} from "../utils";
import {decodeObject, encodeObject, getPrototypeDecoder, objectEncoding} from "./basic";

const errorProperties = ["stack", "name", "message"];
const nonEnumerableProperties = ["stack", "name"];
export function createErrorEncoding(errorCtor: {new(): Error}) {
    return {
        prototypes: [errorCtor.prototype],
        key: getLibraryString(errorCtor.name),
        encode(input: any, ctx: EncodeContext): any {
            const encodedAsObject = encodeObject(input, ctx, false, errorProperties);
            (ctx as any)._isImplicit = false;
            return encodedAsObject;
        },
        decoder: {
            create(encodedValue: any, ctx: DecodeCreateContext): any {
                return new errorCtor();
            },
            init(target: any, encoded: any, ctx: DecodeInitContext) {
                decodeObject(target, encoded, ctx);
            }
        }
    } as SzrPrototypeEncoding;
}

export const errorEncodings = [
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    TypeError,
    URIError,
    SyntaxError
].map(createErrorEncoding);


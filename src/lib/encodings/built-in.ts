import {EncodeContext, SzrPrototypeEncoding} from "../szr-interface";
import {getLibraryString} from "../utils";
import {encodeObject, getPrototypeDecoder, objectEncoding} from "./basic";

const errorProperties = ["stack", "name", "message"];
export function createErrorEncoding(errorCtor: {new(): Error}) {
    return {
        prototypes: [errorCtor.prototype],
        key: getLibraryString(errorCtor.name),
        encode(input: any, ctx: EncodeContext): any {
            const encodedAsObject = encodeObject(input, ctx, false,errorProperties );
            for (const name of errorProperties) {
                Object.defineProperty(encodedAsObject, name, {
                    enumerable: false
                });
            }
            (ctx as any)._isImplicit = false;
            return encodedAsObject;
        },
        decoder: getPrototypeDecoder(errorCtor.prototype)
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


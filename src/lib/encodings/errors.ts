import { CreateContext, InitContext, EncodeContext, PrototypeEncoding } from "../interface";
import { getLibraryEncodingName } from "../utils";
import { decodeObject, encodeObject } from "./basic";

const errorProperties = ["stack", "name", "message"];
export function createErrorEncoding(errorCtor: { new (): Error }) {
    return {
        prototypes: [errorCtor.prototype],
        name: getLibraryEncodingName(errorCtor.name),
        encode(input: any, ctx: EncodeContext): any {
            const encodedAsObject = encodeObject(input, ctx, false, errorProperties);
            (ctx as any)._isImplicit = false;
            return encodedAsObject;
        },
        decoder: {
            create(encodedValue: any, ctx: CreateContext): any {
                return new errorCtor();
            },
            init(target: any, encoded: any, ctx: InitContext) {
                decodeObject(target, encoded, ctx);
            }
        }
    } as PrototypeEncoding;
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

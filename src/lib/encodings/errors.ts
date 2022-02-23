import { CreateContext, InitContext, EncodeContext, PrototypeEncoding } from "../interface";
import { getLibraryEncodingName } from "../utils";
import { decodeObject, encodeObject } from "./basic";
import { Fixed } from "./fixed";

const errorProperties = ["stack", "name", "message"];
export function createErrorEncoding(index: number, errorCtor: { new (): Error }) {
    return {
        prototypes: [errorCtor.prototype],
        name: getLibraryEncodingName(errorCtor.name),
        fixedIndex: index,
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
    createErrorEncoding(Fixed.EvalError, EvalError),
    createErrorEncoding(Fixed.RangeError, RangeError),
    createErrorEncoding(Fixed.ReferenceError, ReferenceError),
    createErrorEncoding(Fixed.TypeError, TypeError),
    createErrorEncoding(Fixed.URIError, URIError),
    createErrorEncoding(Fixed.SyntaxError, SyntaxError),
    createErrorEncoding(Fixed.Error, Error)
];

import {
    CreateContext,
    InitContext,
    EncodeContext,
    PrototypeEncoding
} from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { decodeObject, encodeObject } from "./objects";
import { Fixed } from "./fixed";

const errorProperties = ["stack", "name", "message"];
export function createErrorEncoding(
    index: number,
    errorCtor: { new (): Error }
): PrototypeEncoding<any> {
    return new (class ErrorSubtypeEncoding extends PrototypeEncoding<Error> {
        fixedIndex = index;
        encodes = errorCtor.prototype;
        version = 0;
        name = getBuiltInEncodingName(errorCtor.name);
        encode(input: any, ctx: EncodeContext): any {
            const encodedAsObject = encodeObject(
                input,
                ctx,
                false,
                errorProperties
            );
            (ctx as any)._isImplicit = false;
            return encodedAsObject;
        }
        decoder = {
            create(encodedValue: any, ctx: CreateContext): any {
                return new errorCtor();
            },
            init(target: any, encoded: any, ctx: InitContext) {
                decodeObject(target, encoded, ctx);
            }
        };
    })();
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

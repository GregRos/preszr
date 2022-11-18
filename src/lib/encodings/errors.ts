import {
    CreateContext,
    InitContext,
    EncodeContext,
    PrototypeEncoding
} from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { decodeObject, encodeObject } from "./objects";
import { FixedIndexes } from "./fixed-indexes";
import { defineProtoEncoding } from "./utils";

const errorProperties = ["stack", "name", "message"];

export function createErrorEncoding(
    index: number,
    errorCtor: { new (): Error }
): PrototypeEncoding<any> {
    return defineProtoEncoding(
        class ErrorSubtypeEncoding extends PrototypeEncoding<Error> {
            fixedIndex = index;
            encodes = errorCtor.prototype;
            version = 0;
            name = getBuiltInEncodingName(errorCtor.name);

            encoder = {
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
            };

            decoder = {
                create(encodedValue: any, ctx: CreateContext): any {
                    return new errorCtor();
                },
                init(target: any, encoded: any, ctx: InitContext) {
                    decodeObject(target, encoded, ctx);
                }
            };
        }
    );
}

export const errorEncodings = [
    createErrorEncoding(FixedIndexes.EvalError, EvalError),
    createErrorEncoding(FixedIndexes.RangeError, RangeError),
    createErrorEncoding(FixedIndexes.ReferenceError, ReferenceError),
    createErrorEncoding(FixedIndexes.TypeError, TypeError),
    createErrorEncoding(FixedIndexes.URIError, URIError),
    createErrorEncoding(FixedIndexes.SyntaxError, SyntaxError),
    createErrorEncoding(FixedIndexes.Error, Error)
];

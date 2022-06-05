import {
    CreateContext,
    InitContext,
    EncodeContext,
    PrototypeEncoding,
    fixedIndexProp
} from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { Fixed } from "./fixed";

export const regexpEncoding =
    new (class RegexpEncoding extends PrototypeEncoding<RegExp> {
        encodes = RegExp.prototype;
        version = 0;
        name = getBuiltInEncodingName("RegExp");
        fixedIndex = Fixed.RegExp;
        encode({ source, flags }: RegExp, ctx: EncodeContext): any {
            return flags ? [source, flags] : source;
        }
        decoder = {
            create(input: string | string[], ctx: InitContext) {
                if (typeof input === "string") {
                    return new RegExp(input);
                } else {
                    // A bit wasteful, but these shouldn't be common and this avoids having to do parsing.
                    return new RegExp(input[0], input[1]);
                }
            }
        };
    })();

export const dateEncoding =
    new (class DateEncoding extends PrototypeEncoding<Date> {
        encodes = Date.prototype;
        version = 0;
        fixedIndex = Fixed.Date;
        name = getBuiltInEncodingName("Date");
        encode(input: Date, ctx: EncodeContext): any {
            return input.getTime();
        }
        decoder = {
            create(encodedValue: number, ctx: CreateContext): any {
                return new Date(encodedValue);
            }
        };
    })();

export function makeObjectWrappedEncoding<T extends object>(
    index: number,
    ctor: { new (x: any): T }
): PrototypeEncoding<T> {
    return new (class ObjectWrapperEncoding extends PrototypeEncoding<T> {
        name = getBuiltInEncodingName(ctor.name);
        version = 0;
        fixedIndex = index;
        encodes = ctor.prototype;
        encode(input: any, ctx: EncodeContext): any {
            return input.valueOf();
        }
        decoder = {
            create(encodedValue: any, ctx: CreateContext): any {
                return new ctor(encodedValue);
            }
        };
    })();
}

export const wrapperEncodings = [
    makeObjectWrappedEncoding(Fixed.FundNumber, Number),
    makeObjectWrappedEncoding(Fixed.FundBool, Boolean),
    makeObjectWrappedEncoding(Fixed.FundString, String)
];

import {
    CreateContext,
    InitContext,
    EncodeContext,
    PrototypeEncoding,
    fixedIndexProp
} from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { Fixed } from "./fixed";

export const regexpEncoding: PrototypeEncoding = {
    prototypes: [RegExp.prototype],
    version: 0,
    name: getBuiltInEncodingName("RegExp"),
    [fixedIndexProp]: Fixed.RegExp,
    encode({ source, flags }: RegExp, ctx: EncodeContext): any {
        return flags ? [source, flags] : source;
    },
    decoder: {
        create(input: string | string[], ctx: InitContext) {
            if (typeof input === "string") {
                return new RegExp(input);
            } else {
                // A bit wasteful, but these shouldn't be common and this avoids having to do parsing.
                return new RegExp(input[0], input[1]);
            }
        }
    }
};
export const dateEncoding: PrototypeEncoding = {
    prototypes: [Date.prototype],
    version: 0,
    [fixedIndexProp]: Fixed.Date,
    name: getBuiltInEncodingName("Date"),
    encode(input: Date, ctx: EncodeContext): any {
        return input.getTime();
    },
    decoder: {
        create(encodedValue: number, ctx: CreateContext): any {
            return new Date(encodedValue);
        }
    }
};

export function makeWrapperEncoding(
    index: number,
    ctor: { new (x: any): any }
): PrototypeEncoding {
    return {
        name: getBuiltInEncodingName(ctor.name),
        version: 0,
        [fixedIndexProp]: index,
        prototypes: [ctor.prototype],
        encode(input: any, ctx: EncodeContext): any {
            return input.valueOf();
        },
        decoder: {
            create(encodedValue: any, ctx: CreateContext): any {
                return new ctor(encodedValue);
            }
        }
    };
}

export const wrapperEncodings = [
    makeWrapperEncoding(Fixed.FundNumber, Number),
    makeWrapperEncoding(Fixed.FundBool, Boolean),
    makeWrapperEncoding(Fixed.FundString, String)
];

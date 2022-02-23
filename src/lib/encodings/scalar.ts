import { CreateContext, InitContext, EncodeContext, PrototypeEncoding } from "../interface";
import { getLibraryEncodingName } from "../utils";
import { Fixed } from "./fixed";

export const regexpEncoding: PrototypeEncoding = {
    prototypes: [RegExp.prototype],
    version: 0,
    name: getLibraryEncodingName("RegExp"),
    fixedIndex: Fixed.Regexp,
    encode({ source, flags }: RegExp, ctx: EncodeContext): any {
        return flags ? [source, flags] : source;
    },
    decoder: {
        create(input: string | string[], ctx: InitContext) {
            if (typeof input === "string") {
                return new RegExp(input);
            } else {
                return new RegExp(input[0], input[1]);
            }
        }
    }
};
export const dateEncoding: PrototypeEncoding = {
    prototypes: [Date.prototype],
    version: 0,
    fixedIndex: Fixed.Date,
    name: getLibraryEncodingName("Date"),
    encode(input: Date, ctx: EncodeContext): any {
        return input.getTime();
    },
    decoder: {
        create(encodedValue: number, ctx: CreateContext): any {
            return new Date(encodedValue);
        }
    }
};

export function makeWrapperEncoding(index: number, ctor: { new (x: any): any }): PrototypeEncoding {
    return {
        name: getLibraryEncodingName(ctor.name),
        version: 0,
        fixedIndex: index,
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

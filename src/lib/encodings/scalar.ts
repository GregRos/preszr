import { CreateContext, InitContext, EncodeContext, PrototypeEncoding } from "../interface";
import { getLibraryEncodingName } from "../utils";

export const regexpEncoding: PrototypeEncoding = {
    prototypes: [RegExp.prototype],
    key: getLibraryEncodingName("RegExp"),
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
    key: getLibraryEncodingName("Date"),
    encode(input: Date, ctx: EncodeContext): any {
        return input.getTime();
    },
    decoder: {
        create(encodedValue: number, ctx: CreateContext): any {
            return new Date(encodedValue);
        }
    }
};

export function createFundamentalObjectEncoding(ctor: { new (x): any }): PrototypeEncoding {
    return {
        key: getLibraryEncodingName(ctor.name),
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

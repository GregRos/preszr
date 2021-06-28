import {
    DecodeCreateContext,
    DecodeInitContext,
    EncodeContext,
    SzrPrototypeEncoding
} from "../szr-interface";
import {getEncodedString} from "../utils";

export const regexpEncoding: SzrPrototypeEncoding = {
    prototypes: [RegExp.prototype],
    key: getEncodedString("regexp"),
    encode(input: RegExp, ctx: EncodeContext): any {
        return [input.source, input.flags];
    },
    decoder: {
        create([source, flags], ctx: DecodeInitContext) {
            return new RegExp(source, flags);
        }
    }
};
export const dateEncoding: SzrPrototypeEncoding = {
    prototypes: [Date.prototype],
    key: getEncodedString("date"),
    encode(input: Date, ctx: EncodeContext): any {
        return input.getTime();
    },
    decoder: {
        create(encodedValue: number, ctx: DecodeCreateContext): any {
            return new Date(encodedValue);
        }
    }
};

export function createFundamentalObjectEncoding(ctor: { new(x): any }): SzrPrototypeEncoding {
    return {
        key: getEncodedString(ctor.name),
        prototypes: [ctor.prototype],
        encode(input: any, ctx: EncodeContext): any {
            return input.valueOf();
        },
        decoder: {
            create(encodedValue: any, ctx: DecodeCreateContext): any {
                return new ctor(encodedValue);
            }
        }
    };
}

export const fundamentalObjectEncodings = [
    Number,
    String,
    Boolean
].map(createFundamentalObjectEncoding);


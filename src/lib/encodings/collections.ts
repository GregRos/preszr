import {
    DecodeCreateContext,
    DecodeInitContext,
    EncodeContext,
    PrototypeEncoding,
} from "../interface";
import { getLibraryEncodingName } from "../utils";
import { EncodedEntity, ScalarValue } from "../data-types";

export const mapEncoding: PrototypeEncoding = {
    prototypes: [Map.prototype],
    key: getLibraryEncodingName("Map"),
    encode(input: Map<any, any>, ctx: EncodeContext): any {
        const array = [] as [ScalarValue, ScalarValue][];
        for (const key of input.keys()) {
            const value = input.get(key);
            array.push([ctx.encode(key), ctx.encode(value)]);
        }
        return array;
    },
    decoder: {
        create(encodedValue: any, ctx: DecodeCreateContext): any {
            return new Map();
        },
        init(
            target: Map<any, any>,
            encoded: [ScalarValue, ScalarValue][],
            ctx: DecodeInitContext
        ) {
            for (const [key, value] of encoded) {
                target.set(ctx.decode(key), ctx.decode(value));
            }
        },
    },
};

export const setEncoding: PrototypeEncoding = {
    prototypes: [Set.prototype],
    key: getLibraryEncodingName("Set"),
    encode(input: Set<any>, ctx: EncodeContext): EncodedEntity {
        const outArray = [] as ScalarValue[];
        for (const item of input) {
            outArray.push(ctx.encode(item));
        }
        return outArray;
    },
    decoder: {
        create(): any {
            return new Set();
        },
        init(target: Set<any>, encoded: ScalarValue[], ctx: DecodeInitContext) {
            for (const item of encoded) {
                target.add(ctx.decode(item));
            }
        },
    },
};

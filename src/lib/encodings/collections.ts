import {
    CreateContext,
    InitContext,
    EncodeContext,
    PrototypeEncoding,
    fixedIndexProp
} from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { EncodedEntity, ScalarValue } from "../data";
import { Fixed } from "./fixed";

export const mapEncoding: PrototypeEncoding = {
    name: getBuiltInEncodingName("Map"),
    version: 0,
    [fixedIndexProp]: Fixed.Map,
    prototypes: [Map.prototype],
    encode(input: Map<any, any>, ctx: EncodeContext): any {
        const array = [] as [ScalarValue, ScalarValue][];
        for (const key of input.keys()) {
            const value = input.get(key);
            array.push([ctx.encode(key), ctx.encode(value)]);
        }
        return array;
    },
    decoder: {
        create(encodedValue: any, ctx: CreateContext): any {
            return new Map();
        },
        init(
            target: Map<any, any>,
            encoded: [ScalarValue, ScalarValue][],
            ctx: InitContext
        ) {
            for (const [key, value] of encoded) {
                target.set(ctx.decode(key), ctx.decode(value));
            }
        }
    }
};

export const setEncoding: PrototypeEncoding = {
    name: getBuiltInEncodingName("Set"),
    version: 0,
    [fixedIndexProp]: Fixed.Set,
    prototypes: [Set.prototype],
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
        init(target: Set<any>, encoded: ScalarValue[], ctx: InitContext) {
            for (const item of encoded) {
                target.add(ctx.decode(item));
            }
        }
    }
};

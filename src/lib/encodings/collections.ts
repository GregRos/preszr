import {
    DecodeCreateContext,
    DecodeInitContext,
    EncodeContext,
    PreszrPrototypeEncoding,
} from "../interface";
import { getLibraryString } from "../utils";
import { PreszrEncodedEntity, PreszrLeaf } from "../data-types";

export const mapEncoding: PreszrPrototypeEncoding = {
    prototypes: [Map.prototype],
    key: getLibraryString("Map"),
    encode(input: Map<any, any>, ctx: EncodeContext): any {
        const array = [] as [PreszrLeaf, PreszrLeaf][];
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
            encoded: [PreszrLeaf, PreszrLeaf][],
            ctx: DecodeInitContext
        ) {
            for (const [key, value] of encoded) {
                target.set(ctx.decode(key), ctx.decode(value));
            }
        },
    },
};

export const setEncoding: PreszrPrototypeEncoding = {
    prototypes: [Set.prototype],
    key: getLibraryString("Set"),
    encode(input: Set<any>, ctx: EncodeContext): PreszrEncodedEntity {
        const outArray = [] as PreszrLeaf[];
        for (const item of input) {
            outArray.push(ctx.encode(item));
        }
        return outArray;
    },
    decoder: {
        create(): any {
            return new Set();
        },
        init(target: Set<any>, encoded: PreszrLeaf[], ctx: DecodeInitContext) {
            for (const item of encoded) {
                target.add(ctx.decode(item));
            }
        },
    },
};

import {
    DecodeCreateContext, DecodeInitContext,
    EncodeContext,
    SzrPrototypeEncoding
} from "../interface";
import {getLibraryString} from "../utils";
import {SzrEncodedEntity, SzrLeaf} from "../data-types";

export const MapEncoding: SzrPrototypeEncoding = {
    prototypes: [Map.prototype],
    key: getLibraryString("Map"),
    encode(input: Map<any, any>, ctx: EncodeContext): any {
        const array = [] as [SzrLeaf, SzrLeaf][];
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
        init(target: Map<any, any>, encoded: [SzrLeaf, SzrLeaf][], ctx: DecodeInitContext) {
            for (const [key, value] of encoded) {
                target.set(ctx.decode(key), ctx.decode(value));
            }
        }
    }
};

export const SetEncoding: SzrPrototypeEncoding = {
    prototypes: [Set.prototype],
    key: getLibraryString("Set"),
    encode(input: Set<any>, ctx: EncodeContext): SzrEncodedEntity {
        const outArray = [] as SzrLeaf[];
        for (const item of input) {
            outArray.push(ctx.encode(item));
        }
        return outArray;
    },
    decoder: {
        create(): any {
            return new Set();
        },
        init(target: Set<any>, encoded: SzrLeaf[], ctx: DecodeInitContext) {
            for (const item of encoded) {
                target.add(ctx.decode(item));
            }
        }
    }
};

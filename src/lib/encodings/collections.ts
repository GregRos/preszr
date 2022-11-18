import {
    CreateContext,
    InitContext,
    EncodeContext,
    PrototypeEncoding,
    Decoder
} from "../interface";
import { getBuiltInEncodingName } from "../utils";
import { EncodedEntity, ScalarValue } from "../data";
import { FixedIndexes } from "./fixed-indexes";
import { defineProtoEncoding } from "./utils";

export const mapEncoding = defineProtoEncoding(
    class MapEncoding extends PrototypeEncoding<Map<any, any>> {
        fixedIndex = FixedIndexes.Map;
        name = getBuiltInEncodingName("Map");
        version = 0;
        encodes = Map.prototype;

        encoder = {
            encode(input: Map<any, any>, ctx: EncodeContext): any {
                const array = [] as [ScalarValue, ScalarValue][];
                for (const key of input.keys()) {
                    const value = input.get(key);
                    array.push([ctx.encode(key), ctx.encode(value)]);
                }
                return array;
            }
        };

        decoder = new (class MapDecoder implements Decoder {
            create(encodedValue: any, ctx: CreateContext): any {
                return new Map();
            }

            init(
                target: Map<any, any>,
                encoded: [ScalarValue, ScalarValue][],
                ctx: InitContext
            ) {
                for (const [key, value] of encoded) {
                    target.set(ctx.decode(key), ctx.decode(value));
                }
            }
        })();
    }
);

export const setEncoding = defineProtoEncoding(
    class SetEncoding extends PrototypeEncoding<Set<any>> {
        fixedIndex = FixedIndexes.Set;
        name = getBuiltInEncodingName("Set");
        version = 0;
        encodes = Set.prototype;

        encoder = {
            encode(input: Set<any>, ctx: EncodeContext): EncodedEntity {
                const outArray = [] as ScalarValue[];
                for (const item of input) {
                    outArray.push(ctx.encode(item));
                }
                return outArray;
            }
        };

        decoder = new (class SetDecoder implements Decoder {
            create(): any {
                return new Set();
            }

            init(target: Set<any>, encoded: ScalarValue[], ctx: InitContext) {
                for (const item of encoded) {
                    target.add(ctx.decode(item));
                }
            }
        })();
    }
);

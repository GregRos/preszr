import {
    CreateContext,
    Decoder,
    EncodeContext,
    Encoder,
    InitContext,
    PreszrUnsupportedValue,
    PrototypeEncoding
} from "../interface";
import { getBuiltInEncodingName, getProtoName } from "../utils";
import { ScalarValue } from "../data";
import { FixedIndexes } from "./fixed-indexes";
import {
    _ArrayIteratorProto,
    _FinalizationRegistry,
    _MapIteratorProto,
    _SetIteratorProto,
    _WeakRef
} from "../opt-types";
import { defineProtoEncoding, wrapEncodeFunction } from "./utils";

export const nullPlaceholder = {};

function getAllOwnKeys(obj: object): PropertyKey[] {
    const keys = Reflect.ownKeys(obj);
    return keys.filter(x => Object.prototype.propertyIsEnumerable.call(obj, x));
}

export function decodeObject(target: any, input: any, ctx: InitContext) {
    let stringKeys = input;
    if (Array.isArray(input)) {
        let symbolKeys;
        [symbolKeys, stringKeys] = input;
        for (const key of Object.keys(symbolKeys)) {
            const value = symbolKeys[key];
            target[ctx.decode(key) as symbol] = ctx.decode(
                value as ScalarValue
            );
        }
    }
    for (const key of Object.keys(stringKeys)) {
        const value = stringKeys[key];
        target[key] = ctx.decode(value as ScalarValue);
    }
    return target;
}

export function encodeObject(
    input: any,
    ctx: EncodeContext,
    explicitlyInclude = [] as string[]
) {
    const strKeyObject: any = {};
    let symbKeyObject: Record<string, ScalarValue> | undefined;
    for (const key of getAllOwnKeys(input)) {
        const value = input[key];
        if (typeof key === "symbol") {
            symbKeyObject ??= {};
            symbKeyObject[ctx.encode(key) as string] = ctx.encode(value);
        } else {
            strKeyObject[key] = ctx.encode(value);
        }
    }
    for (const key of explicitlyInclude) {
        if (!(key in strKeyObject) && key in input) {
            strKeyObject[key] = ctx.encode(input[key]);
        }
    }
    if (symbKeyObject) {
        return [symbKeyObject, strKeyObject];
    }
    ctx._isImplicit = true;
    return strKeyObject;
}

export const objectEncoding = defineProtoEncoding(
    class ObjectEncoding extends PrototypeEncoding<object> {
        version = 0;
        encodes = Object.prototype;
        fixedIndex = FixedIndexes.Object;
        name = getBuiltInEncodingName("object");

        encoder = {
            encode(input: any, ctx: EncodeContext) {
                return encodeObject(input, ctx);
            }
        };

        decoder = {
            create(encodedValue: any, ctx: CreateContext): any {
                return {};
            },
            init(target: any, encoded: any, ctx: InitContext) {
                decodeObject(target, encoded, ctx);
            }
        };
    }
);

function encodeAsSparseArray(input: any, ctx: EncodeContext) {
    // Sparse arrays are serialized like objects.
    const result = encodeObject(input, ctx);
    ctx._isImplicit = false;
    return result;
}

export const arrayEncoding = defineProtoEncoding(
    class ArrayEncoding extends PrototypeEncoding<any[]> {
        name = getBuiltInEncodingName("array");
        version = 0;
        fixedIndex = FixedIndexes.Array;
        encodes = Array.prototype;

        encoder = {
            encode(input: any, ctx: EncodeContext): any {
                const keys = Object.keys(input);
                const isSparseCanFalseNegative = input.length !== keys.length;
                if (isSparseCanFalseNegative) {
                    return encodeAsSparseArray(input, ctx);
                }
                // The array still might be sparse, even after that check.
                const newArray = [] as any[];
                for (let i = 0; i < keys.length; i++) {
                    if (i !== +keys[i]) {
                        return encodeAsSparseArray(input, ctx);
                    }
                    newArray.push(ctx.encode(input[i]));
                }
                ctx._isImplicit = true;
                return newArray;
            }
        };

        decoder = {
            create(encodedValue: any, ctx: CreateContext): any {
                return [];
            },
            init(target: any, input: any, ctx: InitContext) {
                if (!Array.isArray(input)) {
                    // Decode similarly to objects
                    decodeObject(target, input, ctx);
                    return;
                }
                for (let i = 0; i < input.length; i++) {
                    target[i] = ctx.decode(input[i]);
                }
            }
        };
    }
);

export const nullPrototypeEncoding = defineProtoEncoding(
    class NullPrototypeEncoding extends PrototypeEncoding<object> {
        version = 0;
        encodes = nullPlaceholder;
        name = getBuiltInEncodingName("null");
        fixedIndex = FixedIndexes.NullProto;
        encoder = getPrototypeEncoder(null as any);
        decoder = getPrototypeDecoder(null) as any;
    }
);

export function getPrototypeDecoder<T extends object | null>(encodes: T) {
    return {
        init: objectEncoding.decoder.init,
        create(encodedValue: any, ctx: CreateContext): any {
            return Object.create(encodes);
        }
    } as Decoder<T>;
}

export function getPrototypeEncoder<T>(proto: T): Encoder<T> {
    return {
        encode(input: T, ctx: EncodeContext) {
            const result = encodeObject(input, ctx);
            (ctx as any)._isImplicit = false;
            return result;
        }
    };
}

class UnsupportedEncoding<T extends object> extends PrototypeEncoding<T> {
    version = 0;

    constructor(
        public readonly name: string,
        public readonly encodes: T,
        public readonly fixedIndex: number
    ) {
        super();
        this.encodes = encodes;
        this.name = name;
    }

    encoder = {
        encode(input: any, ctx: EncodeContext): any {
            return 0;
        }
    };

    decoder = {
        create(encodedValue: any, ctx: CreateContext): any {
            return new PreszrUnsupportedValue(ctx.self.name.slice(1));
        }
    };
}

export const unsupportedEncodings = (
    [
        [Function, FixedIndexes.Function],

        [Promise, FixedIndexes.Promise],
        [WeakSet, FixedIndexes.WeakSet],
        [WeakMap, FixedIndexes.WeakMap],
        [_FinalizationRegistry as any, FixedIndexes.FinalizationRegistry],
        [_WeakRef as any, FixedIndexes.WeakRef]
    ] as const
)
    .filter(x => x[0])
    .map(([ctor, index]) => {
        const name = getBuiltInEncodingName(getProtoName(ctor.prototype));
        return new UnsupportedEncoding(name, ctor.prototype, index);
    });

unsupportedEncodings.push(
    ...[
        [_SetIteratorProto, FixedIndexes.SetIterator],
        [_MapIteratorProto, FixedIndexes.MapIterator],
        [_ArrayIteratorProto, FixedIndexes.ArrayIterator]
    ].map(
        ([proto, index]) =>
            new UnsupportedEncoding(
                getBuiltInEncodingName(getProtoName(proto)),
                proto,
                index
            )
    )
);

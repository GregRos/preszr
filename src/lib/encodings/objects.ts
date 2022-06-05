import {
    EncodeContext,
    PrototypeEncoding,
    CreateContext,
    InitContext,
    Decoder,
    fixedIndexProp,
    PreszrUnsupportedValue
} from "../interface";
import {
    getClassName,
    getBuiltInEncodingName,
    getClass,
    getProto,
    getPrototypeName
} from "../utils";
import { ScalarValue } from "../data";
import { Fixed } from "./fixed";
import {
    _AsyncFunction,
    _AsyncGenerator,
    _AsyncGeneratorFunction,
    _FinalizationRegistry,
    _Generator,
    _GeneratorFunction,
    _WeakRef
} from "../opt-types";

export const nullPlaceholder = {};
function getAllOwnKeys(obj: object, onlyEnumerable: boolean): PropertyKey[] {
    const keys = Reflect.ownKeys(obj);
    if (onlyEnumerable) {
        return keys.filter(x =>
            Object.prototype.propertyIsEnumerable.call(obj, x)
        );
    }
    return keys;
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
    alsoNonEnumerable: boolean,
    explicitlyInclude = [] as string[]
) {
    const strKeyObject: any = {};
    let symbKeyObject: Record<string, ScalarValue> | undefined;
    for (const key of getAllOwnKeys(input, !alsoNonEnumerable)) {
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
    (ctx as any)._isImplicit = true;
    return strKeyObject;
}

export const objectEncoding =
    new (class ObjectEncoding extends PrototypeEncoding<object> {
        version = 0;
        encodes = Object.prototype;
        fixedIndex = Fixed.Object;
        name = getBuiltInEncodingName("object");
        encode(input: any, ctx: EncodeContext): any {
            return encodeObject(input, ctx, false);
        }
        decoder = {
            create(encodedValue: any, ctx: CreateContext): any {
                return {};
            },
            init(target: any, encoded: any, ctx: InitContext) {
                decodeObject(target, encoded, ctx);
            }
        };
    })();

function encodeAsSparseArray(input: any, ctx: EncodeContext) {
    // Sparse arrays are serialized like objects.
    const result = encodeObject(input, ctx, false);
    (ctx as any)._isImplicit = false;
    return result;
}

export const arrayEncoding = new (class ArrayEncoding extends PrototypeEncoding<
    any[]
> {
    name = getBuiltInEncodingName("array");
    version = 0;
    fixedIndex = Fixed.Array;
    encodes = Array.prototype;
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
        (ctx as any)._isImplicit = true;
        return newArray;
    }
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
})();

export const nullPrototypeEncoding =
    new (class NullPrototypeEncoding extends PrototypeEncoding<object> {
        version = 0;
        encodes = nullPlaceholder;
        name = getBuiltInEncodingName("null");
        fixedIndex = Fixed.NullProto;
        encode = getPrototypeEncoder(null);
        decoder = getPrototypeDecoder(null);
    })();

export function getPrototypeDecoder(encodes: object | null) {
    return {
        init: objectEncoding.decoder.init,
        create(encodedValue: any, ctx: CreateContext): any {
            return Object.create(encodes);
        }
    } as Decoder;
}

export function getPrototypeEncoder(proto: object | null) {
    return (input: any, ctx: EncodeContext) => {
        const result = encodeObject(input, ctx, false);
        (ctx as any)._isImplicit = false;
        return result;
    };
}

export const unsupportedEncodingName = getBuiltInEncodingName("unsupported");

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

    encode(input: any, ctx: EncodeContext): any {
        return 0;
    }

    decoder = {
        create(encodedValue: any, ctx: CreateContext): any {
            return new PreszrUnsupportedValue(ctx.self.name.slice(1));
        }
    };
}

export const unsupportedEncodings = [
    [Function, Fixed.Function],
    [_GeneratorFunction, Fixed.GeneratorFunction],
    [_Generator, Fixed.Generator],
    [Promise, Fixed.Promise],
    [WeakSet, Fixed.WeakSet],
    [WeakMap, Fixed.WeakMap],
    [_AsyncGenerator, Fixed.AsyncGenerator],
    [_AsyncGeneratorFunction, Fixed.AsyncGeneratorFunction],
    [_FinalizationRegistry, Fixed.FinalizationRegistry],
    [_AsyncFunction, Fixed.AsyncFunction],
    [_WeakRef, Fixed.WeakRef]
]
    .filter(x => x[0])
    .map(([ctor, index]) => {
        const name = getBuiltInEncodingName(getPrototypeName(ctor.prototype));
        return new UnsupportedEncoding(name, ctor.prototype, index);
    });

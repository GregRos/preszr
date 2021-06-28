import {
    LegalValue,
    EncodeContext,
    SzrPrototypeEncoding,
    SzrOptions,
    DecodeCreateContext,
    DecodeInitContext,
    Decoder, CustomEncoding
} from "../szr-interface";
import {getEncodedString} from "../utils";
import {Leaf, Reference} from "../szr-representation";

export const nullPlaceholder = {};
export const propertyIsEnumerable = (obj, key) => Object.prototype.propertyIsEnumerable.call(obj, key);
function getAllOwnKeys(obj: object, onlyEnumerable: boolean): PropertyKey[] {
    const keys = Reflect.ownKeys(obj);
    if (onlyEnumerable) {
        return keys.filter(propertyIsEnumerable);
    }
    return keys;
}

function getKeys(object: object,options: SzrOptions) {
    if (options.alsoSymbolKeys) {
        return getAllOwnKeys(object, options.alsoNonEnumerable);
    }
    return options.alsoNonEnumerable ? Object.getOwnPropertyNames(object) : Object.keys(object);
}

function decodeObject(target, input, ctx: DecodeInitContext) {
    let stringKeys = input;
    if (Array.isArray(input)) {
        let symbolKeys;
        [stringKeys, symbolKeys] = input;
        for (const [key, value] of Object.entries(symbolKeys)) {
            target[ctx.deref(key) as symbol] = ctx.deref(value as Leaf);
        }
    }
    for (const [key, value] of Object.entries(stringKeys)) {
        target[key] = ctx.deref(value as Leaf);
    }
    return target;
}

export const objectEncoding: SzrPrototypeEncoding = {
    prototype: Object.prototype,
    key: getEncodedString("object"),
    encode(input: any, ctx: EncodeContext): any {
        const newObject = {};
        let symbObject: Record<string, Leaf> | undefined;
        for (const key of getKeys(input, ctx.options)) {
            const value = input[key];
            if (typeof key === "symbol") {
                symbObject ??= {};
                symbObject[ctx.ref(key) as string] = ctx.ref(value);
            } else {
                newObject[key] = ctx.ref(value);
            }
        }
        if (symbObject) {
            return [newObject, symbObject];
        }
        (ctx as any)._isImplicit = true;
        return newObject;
    },
    decoder: {
        create(encodedValue: any, ctx: DecodeCreateContext): any {
            return {};
        },
        init(target: any, encoded: any, ctx: DecodeInitContext) {
            decodeObject(target, encoded, ctx);
        }
    }
};

function encodeAsSparseArray(input: any, ctx: EncodeContext) {
    // Sparse arrays are serialized like objects.
    const result = objectEncoding.encode(input, ctx);
    ctx.metadata = 1;
    return result;
}

export const arrayEncoding: SzrPrototypeEncoding = {
    key: getEncodedString("array"),
    prototype: Array.prototype,
    encode(input: any, ctx: EncodeContext): any {
        const keys = Object.keys(input);
        let isSparseCanFalseNegative = input.length !== keys.length;
        if (isSparseCanFalseNegative) {
            return encodeAsSparseArray(input, ctx);
        }
        // The array still might be sparse, even after that check.
        const newArray = [] as any[];
        for (let i = 0; i < keys.length; i++) {
            if (i !== +keys[i]) {
                return encodeAsSparseArray(input, ctx);
            }
            newArray.push(ctx.ref(input[i]));
        }
        (ctx as any)._isImplicit = true;
        return newArray;
    },
    decoder: {
        create(encodedValue: any, ctx: DecodeCreateContext): any {
            return [];
        },
        init(target: any, input: any, ctx: DecodeInitContext) {
            const isSparse = !!ctx.metadata;
            if (isSparse) {
                // Decode similarly to objects
                decodeObject(target, input, ctx);
                return;
            }
            for (let i = 0; i < input.length; i++) {
                target[i] = ctx.deref(input[i]);
            }
        }
    }
};
export const nullPrototypeEncoding: SzrPrototypeEncoding = {
    ...objectEncoding,
    key: getEncodedString("null"),
    decoder: getPrototypeDecoder(null),
    prototype: nullPlaceholder
};

export function getPrototypeDecoder(proto: object | null) {
    return {
        init: objectEncoding.decoder.init,
        create(encodedValue: any, ctx: DecodeCreateContext): any {
            return Object.create(proto);
        }
    } as Decoder;
}

import {
    DecodeContext,
    LegalValue,
    EncodeContext,
    SzrPrototypeEncoding, SzrOptions
} from "./szr-interface";
import {getEncodedString} from "./utils";
import {Leaf, Reference} from "./szr-representation";

export const nullPlaceholder = {};
export const propertyIsEnumerable = (obj, key) => Object.prototype.propertyIsEnumerable.call(obj, key);
function getAllOwnProperties(obj: object, onlyEnumerable: boolean): PropertyKey[] {
    const keys = Object.getOwnPropertyNames(obj) as PropertyKey[];
    keys.push(...Object.getOwnPropertySymbols(obj));
    if (onlyEnumerable) {
        return keys.filter(propertyIsEnumerable);
    }
    return keys;
}

function getKeys(object: object,options: SzrOptions) {
    if (options.alsoSymbolKeys) {
        return getAllOwnProperties(object, options.alsoNonEnumerable);
    }
    return options.alsoNonEnumerable ? Object.getOwnPropertyNames(object) : Object.keys(object);
}

function decodeObject(target, input, ctx: DecodeContext) {
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
        for (const key of getKeys(ctx.options, input)) {
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
    decode(input: any, ctx): any {
        return decodeObject({}, input, ctx);
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
        const newArray = Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
            if (i !== +keys[i]) {
                return encodeAsSparseArray(input, ctx);
            }
            newArray.push(input[i]);
        }
        (ctx as any)._isImplicit = true;
        return newArray;
    },
    decode(input: any, ctx: DecodeContext): any {
        const isSparse = !!ctx.metadata;
        if (isSparse) {
            // Decode similarly to objects
            return decodeObject([], input, ctx);
        }
        const newArray = Array(input.length);
        for (let i = 0; i < newArray.length; i++) {
            newArray[i] = ctx.deref(input[i]);
        }
        return newArray;
    }
};
(arrayEncoding as any).implicit = true;
export const nullPrototypeEncoding: SzrPrototypeEncoding = {
    ...objectEncoding,
    key: getEncodedString("null"),
    decode: getPrototypeDecode(null),
    prototype: nullPlaceholder
};

export function getPrototypeDecode(proto: object | null) {
    return (input: any, ctx: DecodeContext) => {
        const regular = objectEncoding.decode(input, ctx);
        Object.setPrototypeOf(regular, proto);
        return regular;
    };
}

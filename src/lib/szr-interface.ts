import {getEncodedString} from "./utils";
import {
    Leaf,
    Reference,
    SzrEncodingInformation,
    SzrEntity,
    SzrPrimitive
} from "./szr-representation";
import {getPrototypeDecode, objectEncoding} from "./basic-serializers";

export type LegalValue = SzrPrimitive | SzrEntity | undefined;

export interface EncodeContext {
    ref(value: LegalValue): Leaf;
    options: SzrOptions;
    metadata: unknown;
}

export interface DecodeContext {
    deref(value: Leaf): LegalValue;
    options: SzrOptions;
    metadata: any;
}

export interface SzrSymbolEncoding {
    key: string;
    symbol: symbol;
}

export interface SzrPrototypeEncoding {
    // The constructor - specify this or prototype, not both.
    clazz?: Function;

    // The prototype - specify this or class, not both.
    prototype: object;

    // The key that identifies this encoding. Must be unique.
    key: string;

    // Called to decode objects with the specified prototype. If not provided,
    // objects will be decoded using the standard object decoder and then their
    // prototype will be modified using `Object.setPrototypeOf`.
    // You usually need this if you want the class constructor to be called
    // during decoding, or if you're using custom encoding logic.
    decode(input: any, ctx: DecodeContext): any;

    // Called to encode objects with the specified prototype. If not provided,
    // objects will be encoded using the standard object encoding.
    // You usually only need this to encode special objects, like collections.
    encode(input: any, ctx: EncodeContext): any;
}

export type SzrEncoding = SzrPrototypeEncoding | SzrSymbolEncoding;

export type SzrEncodingSpecifier = Function | Partial<SzrPrototypeEncoding> | SzrSymbolEncoding;

export interface SzrOptions {
    skipValidateVersion: boolean;
    alsoNonEnumerable: boolean;
    errorOnUnknownClass: boolean;
    alsoSymbolKeys: boolean;
    custom: Record<string, any>;
}

export interface SzrConfig {
    encodings: SzrEncodingSpecifier[];
    options: SzrOptions;
}

export type DeepPartial<T> = {
    [K in keyof T]: T[K] extends object ? DeepPartial<T[K]> : T[K] | null | undefined
};

export class SzrError extends Error {

}

export function getPrototypeEncoding(x: Partial<SzrPrototypeEncoding> | Function) {
    if (typeof x === "function") {
        x = {
            clazz: x
        } as Partial<SzrPrototypeEncoding>;
    }
    if (x.clazz != null && x.prototype != null) {
        throw new SzrError("Cannot have both `clazz` and `prototype` in type specifier.");
    }
    if (x.clazz == null && x.prototype == null) {
        throw new SzrError("Type specifier must have either `clazz` or `prototype`.")
    }
    x.clazz ??= x.prototype?.constructor;
    x.prototype ??= x.constructor?.prototype;
    if (x.prototype === undefined) {
        throw new SzrError("Could not find prototype from constructor.");
    }
    x.decode ??= getPrototypeDecode(x.prototype);
    x.encode ??= objectEncoding.encode;
    const detectKey = x.key ?? x.prototype[Symbol.toStringTag] ?? x.clazz?.name;
    if (detectKey == null) {
        throw new SzrError(`Could not detect key for type ${x.prototype}`);
    }
    return x as SzrPrototypeEncoding;
}

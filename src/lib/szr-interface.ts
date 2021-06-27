import {Leaf, SzrEntity, SzrPrimitive} from "./szr-representation";
import {getPrototypeDecoder, objectEncoding} from "./encodings/basic";
import {SzrError} from "./errors";

export type LegalValue = SzrPrimitive | SzrEntity | undefined | bigint;

export interface EncodeContext {
    ref(value: LegalValue): Leaf;
    options: SzrOptions;
    metadata: unknown;
}

export interface DecodeCreateContext {
    options: SzrOptions;
    metadata: unknown;
}

export interface DecodeInitContext extends DecodeCreateContext {
    deref(value: Leaf): LegalValue;
}

export interface Decoder {
    create(encodedValue: any, ctx: DecodeCreateContext): any;
    init?(target: any, encoded: any, ctx: DecodeInitContext): void;
}


export interface SzrSymbolEncoding {
    key: string;
    symbol: symbol;
}

export interface CustomEncoding {
    // The key that identifies this encoding. Must be unique.
    key: string;

    decoder: Decoder;

    // Called to encode objects with the specified prototype. If not provided,
    // objects will be encoded using the standard object encoding.
    // You usually only need this to encode special objects, like collections.
    encode(input: any, ctx: EncodeContext): any;
}

export interface SzrPrototypeEncoding extends CustomEncoding {
    // The constructor - specify this or prototype, not both.
    clazz?: Function;

    // The prototype - specify this or class, not both.
    prototype: object;
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
        throw new SzrError("Type specifier must have either `clazz` or `prototype`.");
    }
    x.clazz ??= x.prototype?.constructor;
    x.prototype ??= x.constructor?.prototype;
    if (x.prototype === undefined) {
        throw new SzrError("Could not find prototype from constructor.");
    }
    x.decoder ??= getPrototypeDecoder(x.prototype);
    x.encode ??= objectEncoding.encode;
    const detectKey = x.key ?? x.prototype[Symbol.toStringTag] ?? x.clazz?.name;
    if (detectKey == null) {
        throw new SzrError(`Could not detect key for type ${x.prototype}`);
    }
    return x as SzrPrototypeEncoding;
}

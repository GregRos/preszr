import {Leaf, SzrEntity, SzrPrimitive} from "./szr-representation";
import {getPrototypeDecoder, getPrototypeEncoder, objectEncoding} from "./encodings/basic";
import {SzrError} from "./errors";
import {getClassName, getImplicitClassEncodingName, getImplicitSymbolEncodingName, getLibraryString, getSymbolName} from "./utils";

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
    metadata?: any;
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
    // The prototype - specify this or prototype, not both
    prototypes: object[];
}

export type SzrEncoding = SzrPrototypeEncoding | SzrSymbolEncoding;

export type SzrEncodingSpecifier = symbol | Function | Partial<SzrPrototypeEncoding & {prototype: object}> | SzrSymbolEncoding;

export interface SzrOptions {
    skipValidateVersion: boolean;
    alsoNonEnumerable: boolean;
    custom: Record<string, any>;
}

export interface SzrConfig {
    encodings: SzrEncodingSpecifier[];
    options: SzrOptions;
    unsupported: Function[];
}

export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
};

export function getSymbolEncoding(x: symbol): SzrSymbolEncoding {
    const key = getSymbolName(x);
    if (!key) {
        throw new SzrError(`Failed to detect symbol name for ${String(x)}`);
    }
    return {
        key: getImplicitSymbolEncodingName(key),
        symbol: x,
    };
}

export function getFullEncoding(input: SzrEncodingSpecifier): SzrEncoding {
    if (typeof input === "symbol") {
        return getSymbolEncoding(input);
    }
    if ("symbol" in input) {
        return input;
    }
    if (typeof input === "function") {
        const proto = input.prototype;
        if (!proto) {
            throw new SzrError("Could not find prototype from constructor.");
        }
        input = {
            prototypes: [proto]
        } as Partial<SzrPrototypeEncoding>;
    }
    if ("prototype" in input) {
        input.prototypes = [input.prototype!];
    }
    if (input.prototypes == null || input.prototypes.length === 0) {
        throw new SzrError("Encoding specifier must specify prototypes.");
    }
    if (input.prototypes.length === 1) {
        const [proto] = input.prototypes;
        input.decoder ??= getPrototypeDecoder(proto);
        input.encode ??= getPrototypeEncoder(proto);
        if (input.key == null) {
            const className = getClassName(proto);
            if (!className) {
                throw new SzrError(`No key has been provided, and the prototype has no name.`);
            }
            input.key = getImplicitClassEncodingName(className);
        }
    } else if (!("decoder" in input && "encode" in input)) {
        throw new SzrError("If you specify multiple prototypes, you have to specify both `encode` and `decoder`");
    } else if (input.key == null) {
        throw new SzrError("If you provide multiple prototypes, you must provide a key.");
    }
    return input as SzrPrototypeEncoding;
}

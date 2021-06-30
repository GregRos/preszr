import {SzrLeaf, SzrEntity, SzrPrimitive} from "./szr-representation";
import {getPrototypeDecoder, getPrototypeEncoder, nullPlaceholder, objectEncoding} from "./encodings/basic";
import {SzrError} from "./errors";
import {getClassName, getImplicitClassEncodingName, getImplicitSymbolEncodingName, getLibraryString, getSymbolName} from "./utils";


export interface EncodeContext {
    ref(value: any): SzrLeaf;
    options: SzrOptions;
    metadata: any;
}

export interface DecodeCreateContext {
    options: SzrOptions;
    metadata: any;
}

export interface DecodeInitContext extends DecodeCreateContext {
    deref(value: SzrLeaf): any;
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

export interface SzrPrototypeEncodingSpecifier {
    key?: string;
    prototype: object | null;
    decoder?: Decoder;
    encode?(input: any, ctx: EncodeContext): any;
}

export interface SzrPrototypeEncoding {
    key: string;
    prototypes: object[];
    decoder: Decoder;
    encode(input: any, ctx: EncodeContext): any;
}

export type SzrEncoding = SzrPrototypeEncoding | SzrSymbolEncoding;

export type SzrEncodingSpecifier = symbol | Function | SzrPrototypeEncodingSpecifier | SzrPrototypeEncoding | SzrSymbolEncoding;

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


export function getSymbolEncoding(x: SzrSymbolEncoding | symbol): SzrSymbolEncoding {
    if (typeof x !== "symbol") {
        return x as any;
    }
    const key = getSymbolName(x);
    if (!key) {
        throw new SzrError(`Failed to detect symbol name for ${String(x)}`);
    }
    return {
        key: getImplicitSymbolEncodingName(key),
        symbol: x,
    } as any;
}

export function getEncodingFromConstructor(ctor: Function) {
    if (!ctor.prototype) {
        throw new SzrError("Failed to detect prototype from constructor.");
    }
    return getEncodingFromPrototypeSpecifier({
        prototype: ctor.prototype
    })
}

export function getEncodingFromPrototypeSpecifier(specifier: SzrPrototypeEncodingSpecifier) {
    const encoding = {} as SzrPrototypeEncoding;
    if (specifier.prototype === undefined) {
        throw new SzrError("Encoding must specify prototype.");
    }
    const proto = specifier.prototype ?? nullPlaceholder;
    encoding.prototypes = [proto];
    const className = getClassName(proto);
    if (!className && !specifier.key) {
        throw new SzrError(`No key has been provided, and the prototype has no name.`);
    }
    encoding.key = specifier.key ?? getImplicitClassEncodingName(className!);
    encoding.encode = specifier.encode ?? getPrototypeEncoder(proto);
    encoding.decoder = specifier.decoder ?? getPrototypeDecoder(proto);
    return encoding;
}

export function getFullEncoding(specifier: SzrEncodingSpecifier): SzrEncoding {
    if (typeof specifier === "symbol" || "symbol" in specifier) return getSymbolEncoding(specifier);
    if (typeof specifier === "function") return getEncodingFromConstructor(specifier);
    if ("prototype" in specifier) return getEncodingFromPrototypeSpecifier(specifier);
    if (!specifier.prototypes || specifier.prototypes.length === 0) {
        throw new SzrError("Encoding must specify prototypes.");
    }
    if (!("decoder" in specifier && "encode" in specifier)) {
        throw new SzrError("Multi-prototype specifier must have both decoder and encode.");
    }
    if (!specifier.key) {
        throw new SzrError("Multi-prototype specifier must provide a key.");
    }
    return specifier;
}

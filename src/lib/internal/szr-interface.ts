import {SzrEncodedEntity, SzrLeaf} from "./szr-representation";


export interface EncodeContext {
    encode(value: any): SzrLeaf;
    options: SzrOptions;
    metadata: any;
}

export interface DecodeCreateContext {
    options: SzrOptions;
    metadata: any;
}

export interface DecodeInitContext extends DecodeCreateContext {
    decode(value: SzrLeaf): any;
}

export interface Decoder {
    create(encoded: SzrEncodedEntity, ctx: DecodeCreateContext): any;
    init?(target: any, encoded: SzrEncodedEntity, ctx: DecodeInitContext): void;
}

export interface SzrSymbolEncoding {
    key: string;
    symbol: symbol;
    metadata?: any;
}

export interface SzrPrototypeSpecifier {
    key?: string;
    prototype: object | null;
    decoder?: Decoder;
    encode?(input: any, ctx: EncodeContext): SzrEncodedEntity;
}

export interface SzrPrototypeEncoding {
    key: string;
    prototypes: object[];
    decoder: Decoder;
    encode(input: any, ctx: EncodeContext): any;
}

export type SzrEncoding = SzrPrototypeEncoding | SzrSymbolEncoding;

export type SzrEncodingSpecifier = symbol | Function | SzrPrototypeSpecifier | SzrPrototypeEncoding | SzrSymbolEncoding;

export interface SzrOptions {
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


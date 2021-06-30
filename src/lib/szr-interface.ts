import {SzrData, SzrLeaf} from "./szr-representation";


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
    encode?(input: any, ctx: EncodeContext): SzrData;
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



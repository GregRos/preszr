export type Version = string;

export interface SzrEncodingInformation {
    [key: number]: string;
}

export type SzrCustomMetadata = any;

export type SzrMetadata = [Version, SzrEncodingInformation?, SzrCustomMetadata?];

export type Reference = string;

export type SzrEntity = string | object | any[] | symbol;

export type SzrPrimitive = boolean | number;

export type UndefinedEncoding = "0";

export type Leaf = SzrPrimitive | Reference;

export type SzrRepresentation = [SzrMetadata, ...unknown[]];

export type SzrOutput = SzrRepresentation | SzrPrimitive | UndefinedEncoding;

import {getLibraryString} from "./utils";

export type Version = string;

export interface SzrEncodingSpec {
    [key: number]: number;
}

export type SzrEncodedEntity = SzrPrimitive | string | SzrDataObject | SzrEncodedEntity[];

export interface SzrDataObject {
    [key: string]: SzrEncodedEntity;
    [key: number]: SzrEncodedEntity;
}

export interface SzrMetadata {
    [key: number]: SzrEncodedEntity;
}

export type SzrEncodingKeys = string[];

export type SzrHeader = [Version, SzrEncodingKeys, SzrEncodingSpec, SzrMetadata];

export type Reference = string;

export type SzrEntity = string | object | any[] | symbol | Function;

export type SzrPrimitive = boolean | number | null;

export type SzrEncodedScalar = string;

export type SzrLeaf = SzrPrimitive | Reference | SzrEncodedScalar;

export type SzrFormat = [SzrHeader, ...SzrEncodedEntity[]];

export type SzrOutput = SzrFormat | SzrPrimitive | SzrEncodedScalar;

export const undefinedEncoding = "-";
export const infinityEncoding = "Infinity";
export const negInfinityEncoding = "-Infinity";
export const negZeroEncoding = "-0";
export const nanEncoding = "NaN";

export const noResultPlaceholder = "";

export function tryEncodeScalar(num: any): SzrEncodedScalar | SzrPrimitive {
    if (num === null || typeof num === "boolean") {
        return num;
    }
    if (num === undefined) {
        return undefinedEncoding;
    }
    if (typeof num === "bigint") {
        return `B${num}`;
    }
    if (Object.is(num, -0)) {
        return negZeroEncoding;
    }
    if (num === Infinity) {
        return infinityEncoding;
    }
    if (num === -Infinity) {
        return negInfinityEncoding;
    }
    if (Object.is(num, NaN)) {
        return nanEncoding;
    }
    if (typeof num === "number") {
        return num;
    }
    return noResultPlaceholder;
}

export function tryDecodeScalar(candidate: any) {
    const t = typeof candidate;
    if (t === "boolean" || t === "number" || candidate === null) return candidate;
    switch (candidate) {
        case infinityEncoding:
            return Infinity;
        case negInfinityEncoding:
            return -Infinity;
        case nanEncoding:
            return NaN;
        case negZeroEncoding:
            return -0;
        case undefinedEncoding:
            return undefined;
    }
    if (t === "string") {
        if (candidate.startsWith("B")) {
            return BigInt(candidate.slice(1));
        }
    }
    return noResultPlaceholder;
}
export const unrecognizedSymbolKey = getLibraryString("symbol?");


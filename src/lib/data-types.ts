import { getLibraryString } from "./utils";

export type Version = string;

export interface PreszrEncodingSpec {
    [key: number]: number;
}

export type PreszrEncodedEntity =
    | PreszrPrimitive
    | string
    | PreszrDataObject
    | PreszrEncodedEntity[];

export interface PreszrDataObject {
    [key: string]: PreszrEncodedEntity;
    [key: number]: PreszrEncodedEntity;
}

export interface PreszrMetadata {
    [key: number]: PreszrEncodedEntity;
}

export type PreszrEncodingKeys = string[];

export type PreszrHeader = [
    Version,
    PreszrEncodingKeys,
    PreszrEncodingSpec,
    PreszrMetadata
];

export type Reference = string;

export type PreszrEntity = string | object | any[] | symbol | Function;

export type PreszrPrimitive = boolean | number | null;

export type PreszrEncodedScalar = string;

export type PreszrLeaf = PreszrPrimitive | Reference | PreszrEncodedScalar;

export type PreszrFormat = [PreszrHeader, ...PreszrEncodedEntity[]];

export type PreszrOutput = PreszrFormat | PreszrPrimitive | PreszrEncodedScalar;

export const undefinedEncoding = "-";
export const infinityEncoding = "Infinity";
export const negInfinityEncoding = "-Infinity";
export const negZeroEncoding = "-0";
export const nanEncoding = "NaN";

export const noResultPlaceholder = "";

export function tryEncodeScalar(num: any): PreszrEncodedScalar | PreszrPrimitive {
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
    if (t === "boolean" || t === "number" || candidate === null)
        return candidate;
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

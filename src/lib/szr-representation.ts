export type Version = string;

export interface SzrEncodingInformation {
    [key: number]: string;
}

export type SzrCustomMetadata = any;

export type SzrMetadata = [Version, SzrEncodingInformation?, SzrCustomMetadata?];

export type Reference = string;

export type SzrEntity = string | object | any[] | symbol;

export type SzrPrimitive = boolean | number | null;

export const undefinedEncoding = "-";
export const infinityEncoding = "Infinity";
export const negInfinityEncoding = "-Infinity";
export const negZeroEncoding = "-0";
export const nanEncoding = "NaN";
export type EncodedScalar =
    typeof undefinedEncoding
    | typeof infinityEncoding
    | typeof negZeroEncoding
    | typeof negInfinityEncoding
    | typeof nanEncoding
    | string;

export type Leaf = SzrPrimitive | Reference | EncodedScalar | string;

export type SzrRepresentation = [SzrMetadata, ...unknown[]];

export type SzrOutput = SzrRepresentation | SzrPrimitive | EncodedScalar | string;

export function isDecodedScalar(input: unknown) {
    const t = typeof input;
    return input == null || t === "bigint" || t === "number" || t === "boolean";
}

export const noResultPlaceholder = "";

export function tryEncodeScalar(num: any): EncodedScalar | SzrPrimitive {
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


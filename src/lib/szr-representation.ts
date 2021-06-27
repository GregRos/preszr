export type Version = string;

export interface SzrEncodingInformation {
    [key: number]: string;
}

export type SzrCustomMetadata = any;

export type SzrMetadata = [Version, SzrEncodingInformation?, SzrCustomMetadata?];

export type Reference = string;

export type SzrEntity = string | object | any[] | symbol;

export type SzrPrimitive = boolean | number;

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
    | typeof nanEncoding;

export type Leaf = SzrPrimitive | Reference | EncodedScalar | string;

export type SzrRepresentation = [SzrMetadata, ...unknown[]];

export type SzrOutput = SzrRepresentation | SzrPrimitive | EncodedScalar | string;

export function encodeScalar(num: number | bigint): EncodedScalar | number | string {
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
    return num;
}


export function tryDecodeScalar(candidate: unknown) {
    if (typeof candidate !== "string") {
        return null;
    }
    switch (candidate) {
        case "Infinity":
            return Infinity;
        case "-Infinity":
            return -Infinity;
        case "NaN":
            return NaN;
        case "-0":
            return -0;
    }
    if (candidate.startsWith("B")) {
        return BigInt(candidate.slice(1));
    }
    return null;
}

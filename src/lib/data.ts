import { getBuiltInEncodingName } from "./utils";
import { _BigInt } from "./opt-types";

export type Version = string;

export interface EncodingSpec {
    [key: number]: number;
}

export type EncodedEntity = Primitive | string | DataObject | EncodedEntity[];

export interface DataObject {
    [key: string]: EncodedEntity;
    [key: number]: EncodedEntity;
}

export interface Metadata {
    [key: number]: EncodedEntity;
}

export type EncodingKeys = string[];

export type Header = [Version, EncodingKeys, EncodingSpec, Metadata];

export type Reference = string;

export type Entity = string | object | any[] | symbol | Function;

export type Primitive = boolean | number | null;

export type EncodedScalar = string;

export type ScalarValue = Primitive | Reference | EncodedScalar;

export type PreszrFormat = [Header, ...EncodedEntity[]];

export type PreszrOutput = PreszrFormat | Primitive | EncodedScalar;

export const undefinedEncoding = "-";
export const infinityEncoding = "Infinity";
export const negInfinityEncoding = "-Infinity";
export const negZeroEncoding = "-0";
export const nanEncoding = "NaN";

export const noResultPlaceholder = "";

export function tryEncodeScalar(num: any): EncodedScalar | Primitive {
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
    if (t === "boolean" || t === "number" || candidate === null) {
        return candidate;
    }
    if (t === "string") {
        if (candidate.startsWith("B")) {
            const result = _BigInt(candidate.slice(1));
            return result;
        }
    }
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

    return noResultPlaceholder;
}

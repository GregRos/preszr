import { isReference } from "./utils";
import { _BigInt } from "./opt-types";

export type Version = string;

export interface KeyMap {
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

export type KeyList = string[];

export type Header = [Version, KeyList, KeyMap, Metadata, number];

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

export const enum ResultType {
    Scalar,
    Reference,
    BadType,
    BadString
}

export type DecodeScalarResult =
    | {
          type: ResultType.Scalar;
          value: Primitive;
      }
    | {
          type: ResultType.Reference;
          value: number;
      }
    | {
          type: ResultType.BadType;
          value: string;
      }
    | {
          type: ResultType.BadString;
          value: undefined;
      };

const decodeResultBox = {
    type: ResultType.Scalar,
    value: 1
} as DecodeScalarResult;
const badType = { type: ResultType.BadType, value: undefined } as const;
const badString = { type: ResultType.BadString, value: undefined } as const;
export function tryDecodeScalar(candidate: any): DecodeScalarResult {
    const t = typeof candidate;
    decodeResultBox.type = ResultType.Scalar;
    if (t === "boolean" || t === "number" || candidate === null) {
        decodeResultBox.value = candidate;
        return decodeResultBox;
    } else if (t === "string") {
        if (candidate.startsWith("B")) {
            const result = _BigInt(candidate.slice(1));
            decodeResultBox.value = result;
            return decodeResultBox;
        }
        switch (candidate) {
            case infinityEncoding:
                decodeResultBox.value = Infinity;
                return decodeResultBox;
            case negInfinityEncoding:
                decodeResultBox.value = -Infinity;
                return decodeResultBox;
            case nanEncoding:
                decodeResultBox.value = NaN;
                return decodeResultBox;
            case negZeroEncoding:
                decodeResultBox.value = -0;
                return decodeResultBox;
            case undefinedEncoding:
                decodeResultBox.value = undefined;
                return decodeResultBox;
        }
        if (isReference(candidate)) {
            decodeResultBox.type = ResultType.Reference;
            decodeResultBox.value = +candidate;
            return decodeResultBox;
        }
        return badString;
    } else {
        decodeResultBox.type = ResultType.BadType;
        decodeResultBox.value = t;
        return decodeResultBox;
    }
}

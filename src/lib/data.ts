import { _BigInt } from "./opt-types"
import { isReference } from "./utils"

export type Version = string

export interface KeyMap {
    [key: number]: number
}

export type EncodedEntity = Primitive | string | DataObject | EncodedEntity[]

export interface DataObject {
    [key: string]: EncodedEntity

    [key: number]: EncodedEntity
}

export interface Metadata {
    [key: number]: EncodedEntity
}

export type KeyList = string[]

export type Header = [Version, KeyList, KeyMap, Metadata, number]

export type Reference = string

export type Entity = string | object | any[] | symbol | Function

export type Primitive = boolean | number | null

export type EncodedScalar = string

export type ScalarValue = Primitive | Reference | EncodedScalar

export type PreszrFormat = [Header, ...EncodedEntity[]]

export type PreszrOutput = PreszrFormat | Primitive | EncodedScalar

export const undefinedEncoding = "-"
export const infinityEncoding = "Infinity"
export const negInfinityEncoding = "-Infinity"
export const negZeroEncoding = "-0"
export const nanEncoding = "NaN"
export const noResultPlaceholder = ""

const constMappings = [
    [undefined, undefinedEncoding],
    [Infinity, infinityEncoding],
    [-Infinity, negInfinityEncoding],
    [-0, negZeroEncoding],
    [NaN, nanEncoding]
] as const

function tryEncodeConst(value: any) {
    for (const pair of constMappings) {
        if (Object.is(value, pair[0])) {
            return pair
        }
    }
    return undefined
}

function tryDecodeConst(value: string) {
    for (const pair of constMappings) {
        if (pair[1] === value) {
            return pair
        }
    }
    return undefined
}

export function tryEncodeScalar(num: any): EncodedScalar | Primitive {
    // First, try to see if it's a constant that needs to be encoded
    const encodedConst = tryEncodeConst(num)
    if (encodedConst !== undefined) {
        return encodedConst[1]
    }
    // if it's a JSON-legal primitive that's not a string, just return it
    if (num === null || typeof num === "boolean" || typeof num === "number") {
        return num
    }
    // If it's bigint, encode it
    if (typeof num === "bigint") {
        return `B${num}`
    }
    return noResultPlaceholder
}

export const enum ResultType {
    Scalar,
    Reference,
    BadType,
    BadString
}

export type DecodeScalarResult =
    | {
          type: ResultType.Scalar
          value: Primitive | bigint | undefined | symbol
      }
    | {
          type: ResultType.Reference
          value: number
      }
    | {
          type: ResultType.BadType
          value: string
      }
    | {
          type: ResultType.BadString
          value: undefined
      }

const result = {
    type: ResultType.Scalar,
    value: 1
} as DecodeScalarResult
const badString = { type: ResultType.BadString, value: undefined } as const
export function tryDecodeScalar(candidate: any): DecodeScalarResult {
    // This function is more complicated because it also tries to detect references
    const t = typeof candidate
    result.type = ResultType.Scalar
    if (t === "boolean" || t === "number" || candidate === null) {
        result.value = candidate
        return result
    } else if (t === "string") {
        if (candidate.startsWith("B")) {
            result.value = _BigInt(candidate.slice(1))
            return result
        }
        const decodedConst = tryDecodeConst(candidate)
        if (decodedConst !== undefined) {
            result.value = decodedConst[0]
            return result
        }
        if (isReference(candidate)) {
            result.type = ResultType.Reference
            result.value = +candidate
            return result
        }
        return badString
    } else {
        result.type = ResultType.BadType
        result.value = t
        return result
    }
}

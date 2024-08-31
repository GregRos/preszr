import { decode_badHeader } from "../errors"
import { ParseError } from "../errors/parse-errors"
import {
    EncodeFunction,
    Encoder,
    PrototypeEncoding,
    PrototypeSpecifier,
    SymbolSpecifier
} from "../interface"
import { isNumericString } from "../utils"

export interface ProtoEncodingKeyInfo {
    type: "prototype"
    name: string
    version: number
}

export interface SymbolEncodingKeyInfo {
    type: "symbol"
    name: string
}

export type EncodingKeyInfo = ProtoEncodingKeyInfo | SymbolEncodingKeyInfo

export type PrototypeEncodingCtor<T extends object> = {
    new (): PrototypeEncoding<T>
}

export function isSymbolSpecifier(
    encoding: PrototypeSpecifier<any> | SymbolSpecifier<any>
): encoding is SymbolSpecifier<any> {
    return typeof encoding.encodes === "symbol"
}

export function defineProtoEncoding<Type extends object>(
    cls: PrototypeEncodingCtor<Type>
): PrototypeEncoding<Type> {
    return new cls()
}

export function mustParseEncodingKey(key: string): EncodingKeyInfo {
    const lastDot = key.lastIndexOf(".")
    if (lastDot === -1) {
        throw decode_badHeader(ParseError.header__key_unknown_format, key)
    }
    const strPostfix = key.slice(lastDot + 1)
    const name = key.slice(0, lastDot)
    if (strPostfix === "S") {
        return {
            type: "symbol",
            name
        }
    }
    if (!strPostfix.startsWith("v")) {
        throw decode_badHeader(ParseError.header__key_unknown_format, key)
    }
    const strVersion = strPostfix.slice(1)
    if (!isNumericString(strVersion)) {
        throw decode_badHeader(ParseError.header__key_unknown_format, key)
    }
    if (!name) {
        throw decode_badHeader(ParseError.header__key_unknown_format, key)
    }
    return {
        type: "prototype",
        name,
        version: +strVersion
    }
}

export function wrapEncodeFunction<T>(
    encode: EncodeFunction<T> | undefined
): Encoder<T> | undefined {
    if (!encode) {
        return undefined
    }
    return {
        encode
    }
}

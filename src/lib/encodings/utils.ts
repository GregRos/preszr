import { isNumericString } from "../utils";
import {
    EncodeFunction,
    Encoder,
    PrototypeEncoding,
    PrototypeSpecifier,
    SymbolSpecifier
} from "../interface";
import { getErrorByCode } from "../errors/texts";

export interface ProtoEncodingKeyInfo {
    type: "prototype";
    name: string;
    version: number;
}

export interface SymbolEncodingKeyInfo {
    type: "symbol";
    name: string;
}

export type EncodingKeyInfo = ProtoEncodingKeyInfo | SymbolEncodingKeyInfo;

export type PrototypeEncodingCtor<T extends object> = {
    new (): PrototypeEncoding<T>;
};

export function isSymbolSpecifier(
    encoding: PrototypeSpecifier | SymbolSpecifier
): encoding is SymbolSpecifier {
    return typeof encoding.encodes === "symbol";
}

export function defineProtoEncoding<Type extends object>(
    cls: PrototypeEncodingCtor<Type>
): PrototypeEncoding<Type> {
    return new cls();
}

export function mustParseEncodingKey(key: string): EncodingKeyInfo {
    const lastDot = key.lastIndexOf(".");
    if (lastDot === -1) {
        throw getErrorByCode("decode/keys/bad-format")(key);
    }
    const strPostfix = key.slice(lastDot + 1);
    const name = key.slice(0, lastDot);
    if (strPostfix === "S") {
        return {
            type: "symbol",
            name
        };
    }
    if (!strPostfix.startsWith("v")) {
        throw getErrorByCode("decode/keys/bad-format")(key);
    }
    const strVersion = strPostfix.slice(1);
    if (!isNumericString(strVersion)) {
        throw getErrorByCode("decode/keys/bad-format")(key);
    }
    if (!name) {
        throw getErrorByCode("decode/keys/bad-format")(key);
    }
    return {
        type: "prototype",
        name,
        version: +strVersion
    };
}

export function wrapEncodeFunction<T>(
    encode: EncodeFunction<T> | undefined
): Encoder<T> | undefined {
    if (!encode) {
        return undefined;
    }
    return {
        encode
    };
}

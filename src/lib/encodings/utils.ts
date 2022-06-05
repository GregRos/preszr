import { PreszrError } from "../errors";
import { isNumericString } from "../utils";

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

export function mustParseEncodingKey(key: string): EncodingKeyInfo {
    const lastDot = key.lastIndexOf(".");
    if (lastDot === -1) {
        throw new PreszrError(
            "Decoding",
            `In encoding key ${key}, had no postfix.`
        );
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
        throw new PreszrError("Decoding", `Unknown postfix ${strPostfix}.`);
    }
    const strVersion = strPostfix.slice(1);
    if (!isNumericString(strVersion)) {
        throw new PreszrError(
            "Decoding",
            `For encoding key ${key}, version wasn't numeric.`
        );
    }
    if (!name) {
        throw new PreszrError(
            "Decoding",
            `For encoding key ${key}, name was empty.`
        );
    }
    return {
        type: "prototype",
        name,
        version: +strVersion
    };
}

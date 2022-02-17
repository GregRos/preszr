import { PreszrError } from "../errors";
import { getPrototypeDecoder, getPrototypeEncoder, nullPlaceholder } from "./basic";
import {
    getClassName,
    getImplicitClassEncodingName,
    getImplicitSymbolEncodingName,
    getSymbolName,
    isNumericString
} from "../utils";
import {
    Encoding,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeEncodingSpecifier,
    SymbolEncoding
} from "../interface";

export function makeSymbolEncoding(x: SymbolEncoding | symbol): SymbolEncoding {
    if (typeof x !== "symbol") {
        return x as any;
    }
    const key = getSymbolName(x);
    if (!key) {
        throw new PreszrError(`Failed to detect symbol name for ${String(x)}`);
    }
    return {
        key: getImplicitSymbolEncodingName(key),
        symbol: x
    } as any;
}

export function makeProtoEncodingByCtor(ctor: Function) {
    if (!ctor.prototype) {
        throw new PreszrError("Failed to detect prototype from constructor.");
    }
    return makeProtoEncoding({
        prototype: ctor.prototype,
        version: 0
    });
}

export function makeProtoEncoding(specifier: PrototypeEncodingSpecifier): PrototypeEncoding {
    const encoding = {} as PrototypeEncoding;

    // protype CAN be `null`.
    if (specifier.prototype === undefined) {
        throw new PreszrError("Encoding must specify a prototype.");
    }
    if (typeof specifier.prototype === "function") {
        throw new PreszrError(
            "Prototype cannot be a function. Did you mean to supply a constructor instead?"
        );
    }
    const proto = specifier.prototype ?? nullPlaceholder;
    encoding.prototypes = [proto];
    const className = getClassName(proto);
    if (!className && !specifier.key) {
        throw new PreszrError(`No key has been provided, and the prototype has no name.`);
    }
    encoding.key = specifier.key ?? getImplicitClassEncodingName(className!);
    encoding.encode = specifier.encode ?? getPrototypeEncoder(proto);
    encoding.decoder = specifier.decoder ?? getPrototypeDecoder(proto);
    const v = specifier.version;
    if (v != null && (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0)) {
        throw new PreszrError(
            `Provided version for encoding ${specifier.key} must be an safe, non-negative integer, but was: ${v}.`
        );
    }
    encoding.version = specifier.version == null ? 0 : specifier.version;

    return encoding;
}

export function makeFullEncoding(specifier: EncodingSpecifier): Encoding {
    if (typeof specifier === "symbol" || "symbol" in specifier) {
        return makeSymbolEncoding(specifier);
    }
    if (typeof specifier === "function") {
        return makeProtoEncodingByCtor(specifier);
    }
    if ("prototype" in specifier) specifier = makeProtoEncoding(specifier);
    if (!specifier.prototypes || specifier.prototypes.length === 0) {
        throw new PreszrError("Encoding must specify prototypes.");
    }
    if (!("decoder" in specifier && "encode" in specifier)) {
        throw new PreszrError("Multi-prototype specifier must have both decoder and encode.");
    }
    if (!specifier.key) {
        throw new PreszrError("Multi-prototype specifier must provide a key.");
    }
    const v = specifier.version;
    if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0) {
        throw new PreszrError(
            `Version for encoding ${specifier.key} must be an safe, non-negative integer, but was: ${v}.`
        );
    }
    return specifier;
}

export function getFullEncodingKey(enc: Encoding) {
    return `${enc.key}.${enc.version}`;
}

export function parseEncodingKey(key: string) {
    const lastDot = key.lastIndexOf(".");
    const strVersion = key.slice(lastDot + 1);
    if (!isNumericString(strVersion)) {
        throw new PreszrError(`Version in encoding key ${key} wasn't numeric.`);
    }
    if (strVersion.trim() === "") {
        throw new PreszrError("Encoding name was empty.");
    }
    return {
        key: key.slice(0, lastDot),
        version: +strVersion
    };
}

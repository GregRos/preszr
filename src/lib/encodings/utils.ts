import { PreszrError } from "../errors";
import {
    getPrototypeDecoder,
    getPrototypeEncoder,
    nullPlaceholder
} from "./basic";
import {
    getClassName,
    getImplicitClassEncodingName,
    getSymbolName,
    isNumericString
} from "../utils";
import {
    Encoding,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeEncodingSpecifier,
    SymbolEncoding,
    UserEncoding
} from "../interface";

const MAX_VERSION = 1024;
const MIN_VERSION = 0;

export function makeSymbolEncoding(x: SymbolEncoding | symbol): SymbolEncoding {
    if (typeof x !== "symbol") {
        return x;
    }
    const name = getSymbolName(x);
    if (!name) {
        throw new PreszrError(`Configuration - Symbol's name was empty.`);
    }
    return {
        name: name,
        symbol: x
    };
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

export function makeProtoEncoding(
    specifier: PrototypeEncodingSpecifier
): PrototypeEncoding {
    const encoding = {} as PrototypeEncoding;

    // protype CAN be `null`.
    if (specifier.prototype === undefined) {
        throw new PreszrError(
            "Configuration - Encoding must specify a prototype."
        );
    }
    if (typeof specifier.prototype === "function") {
        throw new PreszrError(
            "Configuration - Prototype can't be a function. Did you mean to supply a constructor instead?"
        );
    }
    const proto = specifier.prototype ?? nullPlaceholder;
    encoding.prototypes = [proto];
    const className = getClassName(proto);
    if (!className && !specifier.name) {
        throw new PreszrError(
            `Configuration - No key has been provided, and the prototype has no name.`
        );
    }
    encoding.name = specifier.name ?? getImplicitClassEncodingName(className!);
    encoding.encode = specifier.encode ?? getPrototypeEncoder(proto);
    encoding.decoder = specifier.decoder ?? getPrototypeDecoder(proto);
    const v = specifier.version;
    if (
        v != null &&
        (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0)
    ) {
        throw new PreszrError(
            `Provided version for encoding ${specifier.name} must be an safe, non-negative integer, but was: ${v}.`
        );
    }
    encoding.version = specifier.version == null ? 0 : specifier.version;

    return encoding;
}

export function makeFullEncoding(specifier: EncodingSpecifier): UserEncoding {
    if (typeof specifier === "symbol" || "symbol" in specifier) {
        return makeSymbolEncoding(specifier);
    }
    if (typeof specifier === "function") {
        return makeProtoEncodingByCtor(specifier);
    }
    if ("prototype" in specifier) {
        specifier = makeProtoEncoding(specifier);
    }
    if (!specifier.prototypes || specifier.prototypes.length === 0) {
        throw new PreszrError(
            "Configuration - Encoding must specify prototypes."
        );
    }
    if (!("decoder" in specifier && "encode" in specifier)) {
        throw new PreszrError(
            "Configuration - Multi-prototype specifier must have both decoder and encode."
        );
    }
    if (!specifier.name) {
        throw new PreszrError(
            "Configuration - Multi-prototype specifier must provide a key."
        );
    }
    const v = specifier.version;
    if (typeof v !== "number" || !Number.isSafeInteger(v)) {
        throw new PreszrError(
            `Configuration - Version for encoding ${specifier.name} must be an safe integer, but was: ${v}.`
        );
    }
    if (v > MAX_VERSION || v < MIN_VERSION) {
        throw new PreszrError(
            `Configuration - Version number for ${specifier.name} must be between ${MIN_VERSION} and ${MAX_VERSION}, but was: ${v}`
        );
    }
    return specifier;
}

export function getEncodingKey(enc: Encoding) {
    if ("prototypes" in enc) {
        return `${enc.name}.v${enc.version}`;
    }
    return `${enc.name}.S`;
}

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
            `Bad format - in encoding key ${key}, had no postfix.`
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
    const strVersion = strPostfix.slice(1);
    if (!isNumericString(strVersion)) {
        throw new PreszrError(
            `Bad format - in encoding key ${key}, version wasn't numeric.`
        );
    }
    if (strPostfix.trim() === "") {
        throw new PreszrError(
            `Bad format - in encoding key ${key}, name was empty.`
        );
    }
    return {
        type: "prototype",
        name,
        version: +strPostfix
    };
}

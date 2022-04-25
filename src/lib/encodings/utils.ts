import { PreszrError } from "../errors";
import {
    getPrototypeDecoder,
    getPrototypeEncoder,
    nullPlaceholder
} from "./objects";
import {
    getClassName,
    getImplicitClassEncodingName,
    getSymbolName,
    isNumericString
} from "../utils";
import {
    Encoding,
    EncodingSpecifier,
    fixedIndexProp,
    PrototypeEncoding,
    PrototypeEncodingSpecifier,
    SymbolEncoding,
    UserEncoding
} from "../interface";
import { getBuiltInEncoding } from "./index";

const MAX_VERSION = 999;
const MIN_VERSION = 0;

export function makeSymbolEncoding(x: SymbolEncoding | symbol): SymbolEncoding {
    if (typeof x !== "symbol") {
        return x;
    }
    const name = getSymbolName(x);
    if (!name) {
        throw new PreszrError(
            "Configuration",
            `Symbol has no name. You must specify a 'key'.`
        );
    }
    return {
        name: name,
        symbol: x
    };
}

export function makeProtoEncodingByCtor(ctor: Function) {
    if (!ctor.prototype) {
        throw new PreszrError(
            "Configuration",
            "Failed to detect prototype from constructor."
        );
    }
    return makeProtoEncoding({
        proto: ctor.prototype,
        version: 0
    });
}

export function makeProtoEncoding(
    specifier: PrototypeEncodingSpecifier
): PrototypeEncoding {
    // protype CAN be `null`.
    if (specifier.proto === undefined) {
        throw new PreszrError(
            "Configuration",
            "Encoding must specify a prototype."
        );
    }
    if (typeof specifier.proto === "function") {
        throw new PreszrError(
            "Configuration",
            "Prototype can't be a function. Did you mean to supply a constructor instead?"
        );
    }
    const v = specifier.version;
    if (
        v != null &&
        (typeof v !== "number" || !Number.isSafeInteger(v) || v < 1)
    ) {
        throw new PreszrError(
            "Configuration",
            `Version for encoding ${specifier.name} must be an safe, positive integer, but was: ${v}.`
        );
    }
    const builtInEncoding = getBuiltInEncoding(specifier.proto);
    const encoding = {} as PrototypeEncoding;

    if (builtInEncoding) {
        if (specifier.name != null) {
            throw new PreszrError(
                "Configuration",
                "When overriding a default encoding, 'name' must not exist."
            );
        }
        if (v == null || v <= 0) {
            throw new PreszrError(
                "Configuration",
                "When overriding a default encoding, 'version' must exist and be greater than 0."
            );
        }
        specifier.name = builtInEncoding.name;
        encoding[fixedIndexProp] = builtInEncoding[fixedIndexProp];
    }
    const proto = specifier.proto ?? nullPlaceholder;
    const className = getClassName(proto);
    if (!className && !specifier.name) {
        throw new PreszrError(
            "Configuration",
            `No key has been provided, and the prototype has no name.`
        );
    }

    encoding.protos = [proto];
    encoding.name = specifier.name ?? getImplicitClassEncodingName(className!);
    encoding.encode = specifier.encode ?? getPrototypeEncoder(proto);
    encoding.decoder = specifier.decoder ?? getPrototypeDecoder(proto);

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
    if ("proto" in specifier) {
        specifier = makeProtoEncoding(specifier);
    }
    if (!specifier.protos || specifier.protos.length === 0) {
        throw new PreszrError(
            "Configuration",
            "Encoding must specify prototypes."
        );
    }
    if (!("decoder" in specifier && "encode" in specifier)) {
        throw new PreszrError(
            "Configuration",
            "Multi-prototype specifier must have both decoder and encode."
        );
    }
    if (!specifier.name) {
        throw new PreszrError(
            "Configuration",
            "Multi-prototype specifier must provide a key."
        );
    }
    const v = specifier.version;
    if (typeof v !== "number" || !Number.isSafeInteger(v)) {
        throw new PreszrError(
            "Configuration",
            `Version for encoding ${specifier.name} must be an safe integer, but was: ${v}.`
        );
    }
    if (v > MAX_VERSION || v < MIN_VERSION) {
        throw new PreszrError(
            "Configuration",
            `Version number for ${specifier.name} must be between ${MIN_VERSION} and ${MAX_VERSION}, but was: ${v}`
        );
    }
    return specifier;
}

export function getEncodingKey(enc: Encoding) {
    if ("protos" in enc) {
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
    if (strPostfix !== "v") {
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

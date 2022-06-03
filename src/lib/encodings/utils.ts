import { PreszrError } from "../errors";
import {
    getPrototypeDecoder,
    getPrototypeEncoder,
    nullPlaceholder
} from "./objects";
import {
    getClassName,
    getProto,
    getSymbolName,
    isNumericString
} from "../utils";
import {
    Encoding,
    fixedIndexProp,
    OverrideSpecifier,
    PrototypeEncoding,
    PrototypeSpecifier,
    NonOverrideSpecifier,
    SymbolEncoding
} from "../interface";

const MAX_VERSION = 999;
const MIN_VERSION = 0;

function mustBeValidPrototype(proto: object) {
    if (proto === undefined) {
        throw new PreszrError(
            "Configuration",
            "Prototype cannot be undefined."
        );
    }
    if (typeof proto === "function") {
        throw new PreszrError(
            "Configuration",
            `Prototype was a function: '${proto.name}'. Did you mean to pass it as a constructor?`
        );
    }
    if (typeof proto !== "object") {
        throw new PreszrError(
            "Configuration",
            `One of the prototypes was of an unexpected type. It was: ${typeof proto}`
        );
    }
}

export function mustHaveValidVersion(version: number, name?: string) {
    if (typeof version !== "number" || !Number.isSafeInteger(version)) {
        throw new PreszrError(
            "Configuration",
            `Version for encoding ${name} must be an safe integer, but was: ${version}.`
        );
    }
    if (version > MAX_VERSION || version < MIN_VERSION) {
        throw new PreszrError(
            "Configuration",
            `Version for encoding ${name} must be between ${MIN_VERSION} and ${MAX_VERSION}, but was: ${version}`
        );
    }
}

function makeFromFullProto(encoding: PrototypeEncoding) {
    mustHaveValidVersion(encoding.version, encoding.name);
    if (!encoding.protos || encoding.protos.length === 0) {
        throw new PreszrError(
            "Configuration",
            "Full prototype encoding must specify one or more prototypes."
        );
    }
    encoding.protos.forEach(mustBeValidPrototype);
    if (!encoding.name) {
        throw new PreszrError(
            "Configuration",
            "Multi-prototype specifier must provide a name."
        );
    }
    if (!encoding.decoder) {
        throw new PreszrError(
            "Configuration",
            "Multi-prototype specifier must provide a decoder object."
        );
    }
    if (!encoding.encode) {
        throw new PreszrError(
            "Configuration",
            "Multi-prototype specifier must provide an encode function."
        );
    }
    return {
        decoder: encoding.decoder,
        protos: encoding.protos.slice(),
        name: encoding.name,
        encode: encoding.encode,
        version: encoding.version,
        [fixedIndexProp]: encoding[fixedIndexProp]
    };
}

export function makeFromPartialSymbol(
    encoding: SymbolEncoding
): SymbolEncoding {
    if (!encoding.symbol) {
        throw new PreszrError(
            "Configuration",
            "You must specify a 'symbol' property for a symbol encoding."
        );
    }
    if (typeof encoding.symbol !== "symbol") {
        throw new PreszrError(
            "Configuration",
            `The 'symbol' property must be a symbol, but it was: ${typeof encoding.symbol}`
        );
    }
    const name = encoding.name ?? getSymbolName(encoding.symbol);
    if (!name) {
        throw new PreszrError(
            "Configuration",
            `Symbol has no name. You must specify a 'name' property.`
        );
    }
    return {
        name,
        symbol: encoding.symbol,
        [fixedIndexProp]: encoding[fixedIndexProp]
    };
}

export function makeFromCtor(ctor: Function) {
    return makeFromPartialProto({
        encodes: ctor
    });
}

export function makeOverrideEncoding(
    original: PrototypeEncoding | undefined,
    override: OverrideSpecifier
): PrototypeEncoding {
    if (!original) {
        throw new PreszrError(
            "Configuration",
            `Failed to find prototype encoding for ${getClassName(
                override?.overrides
            )} to override.`
        );
    }
    const proto =
        override.overrides === null
            ? nullPlaceholder
            : getProto(override.overrides);

    mustHaveValidVersion(override.version, getClassName(proto) ?? "???");
    return {
        name: original.name,
        [fixedIndexProp]: original[fixedIndexProp],
        encode: override.encode,
        decoder: override.decoder,
        protos: [proto],
        version: override.version
    };
}

export function mustMakeEncoding(encoding: NonOverrideSpecifier): Encoding {
    if (typeof encoding === "function") {
        return makeFromCtor(encoding);
    } else if (typeof encoding === "symbol") {
        return makeFromSymbol(encoding);
    } else if (typeof encoding !== "object") {
        throw new PreszrError(
            "Configuration",
            `Expected encoding specifier to be an object, function, or symbol, but was: ${typeof encoding}.`
        );
    } else if ("protos" in encoding && encoding.protos) {
        return makeFromFullProto(encoding);
    } else if ("encodes" in encoding && encoding.encodes !== undefined) {
        return makeFromPartialProto(encoding);
    } else if ("symbol" in encoding && encoding.symbol) {
        return makeFromPartialSymbol(encoding);
    } else {
        throw new PreszrError(
            "Configuration",
            "Encoding specifier must have one of the properties: 'symbol', 'proto', or 'protos'."
        );
    }
}

function makeFromSymbol(symb: symbol) {
    const name = getSymbolName(symb);
    if (!name) {
        throw new PreszrError(
            "Configuration",
            `Symbol has no name. You must specify a full symbol encoding with a 'name' property.`
        );
    }
    return {
        kind: "symbol",
        name,
        symbol: symb
    };
}

export function makeFromPartialProto(
    specifier: PrototypeSpecifier
): PrototypeEncoding {
    if (specifier.encodes === undefined) {
        throw new PreszrError(
            "Configuration",
            "Encoding must specify a prototype."
        );
    }
    const proto = getProto(specifier.encodes);

    const name = specifier.name ?? getClassName(proto);
    if (!name) {
        throw new PreszrError(
            "Configuration",
            "Couldn't get the prototype's name. Set the 'name' property on the encoding to specify one."
        );
    }

    if (specifier.version != null) {
        mustHaveValidVersion(specifier.version, name);
    } else {
        specifier.version = 0;
    }

    return {
        protos: [proto],
        version: specifier.version,
        decoder: specifier.decoder ?? getPrototypeDecoder(proto),
        encode: specifier.encode ?? getPrototypeEncoder(proto),
        name
    };
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

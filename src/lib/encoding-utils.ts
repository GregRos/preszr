import { PreszrError } from "./errors";
import {
    getPrototypeDecoder,
    getPrototypeEncoder,
    nullPlaceholder,
} from "./encodings/basic";
import {
    getClassName,
    getImplicitClassEncodingName,
    getImplicitSymbolEncodingName,
    getSymbolName,
} from "./utils";
import {
    Encoding,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeEncodingSpecifier,
    SymbolEncoding,
} from "./interface";

export function makeSymbolEncoding(
    x: SymbolEncoding | symbol
): SymbolEncoding {
    if (typeof x !== "symbol") {
        return x as any;
    }
    const key = getSymbolName(x);
    if (!key) {
        throw new PreszrError(`Failed to detect symbol name for ${String(x)}`);
    }
    return {
        key: getImplicitSymbolEncodingName(key),
        symbol: x,
    } as any;
}

export function makeEncodingFromCtor(ctor: Function) {
    if (!ctor.prototype) {
        throw new PreszrError("Failed to detect prototype from constructor.");
    }
    return makeEncodingFromSpecifier({
        prototype: ctor.prototype,
    });
}

export function makeEncodingFromSpecifier(specifier: PrototypeEncodingSpecifier) {
    const encoding = {} as PrototypeEncoding;
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
        throw new PreszrError(
            `No key has been provided, and the prototype has no name.`
        );
    }
    encoding.key = specifier.key ?? getImplicitClassEncodingName(className!);
    encoding.encode = specifier.encode ?? getPrototypeEncoder(proto);
    encoding.decoder = specifier.decoder ?? getPrototypeDecoder(proto);
    return encoding;
}

export function makeFullEncoding(specifier: EncodingSpecifier): Encoding {
    if (typeof specifier === "symbol" || "symbol" in specifier)
        return makeSymbolEncoding(specifier);
    if (typeof specifier === "function") return makeEncodingFromCtor(specifier);
    if ("prototype" in specifier) return makeEncodingFromSpecifier(specifier);
    if (!specifier.prototypes || specifier.prototypes.length === 0) {
        throw new PreszrError("Encoding must specify prototypes.");
    }
    if (!("decoder" in specifier && "encode" in specifier)) {
        throw new PreszrError(
            "Multi-prototype specifier must have both decoder and encode."
        );
    }
    if (!specifier.key) {
        throw new PreszrError("Multi-prototype specifier must provide a key.");
    }
    return specifier;
}

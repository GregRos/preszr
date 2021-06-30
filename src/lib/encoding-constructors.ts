import {SzrError} from "./errors";
import {getPrototypeDecoder, getPrototypeEncoder, nullPlaceholder} from "./encodings/basic";
import {getClassName, getImplicitClassEncodingName, getImplicitSymbolEncodingName, getSymbolName} from "./utils";
import {SzrEncoding, SzrEncodingSpecifier, SzrPrototypeEncoding, SzrPrototypeSpecifier, SzrSymbolEncoding} from "./szr-interface";

export function getSymbolEncoding(x: SzrSymbolEncoding | symbol): SzrSymbolEncoding {
    if (typeof x !== "symbol") {
        return x as any;
    }
    const key = getSymbolName(x);
    if (!key) {
        throw new SzrError(`Failed to detect symbol name for ${String(x)}`);
    }
    return {
        key: getImplicitSymbolEncodingName(key),
        symbol: x
    } as any;
}

export function getEncodingFromConstructor(ctor: Function) {
    if (!ctor.prototype) {
        throw new SzrError("Failed to detect prototype from constructor.");
    }
    return getEncodingFromPrototypeSpecifier({
        prototype: ctor.prototype
    });
}

export function getEncodingFromPrototypeSpecifier(specifier: SzrPrototypeSpecifier) {
    const encoding = {} as SzrPrototypeEncoding;
    if (specifier.prototype === undefined) {
        throw new SzrError("Encoding must specify prototype.");
    }
    if (typeof specifier.prototype === "function") {
        throw new SzrError("Prototype cannot be a function. Did you supply a constructor instead?");
    }
    const proto = specifier.prototype ?? nullPlaceholder;
    encoding.prototypes = [proto];
    const className = getClassName(proto);
    if (!className && !specifier.key) {
        throw new SzrError(`No key has been provided, and the prototype has no name.`);
    }
    encoding.key = specifier.key ?? getImplicitClassEncodingName(className!);
    encoding.encode = specifier.encode ?? getPrototypeEncoder(proto);
    encoding.decoder = specifier.decoder ?? getPrototypeDecoder(proto);
    return encoding;
}

export function getFullEncoding(specifier: SzrEncodingSpecifier): SzrEncoding {
    if (typeof specifier === "symbol" || "symbol" in specifier) return getSymbolEncoding(specifier);
    if (typeof specifier === "function") return getEncodingFromConstructor(specifier);
    if ("prototype" in specifier) return getEncodingFromPrototypeSpecifier(specifier);
    if (!specifier.prototypes || specifier.prototypes.length === 0) {
        throw new SzrError("Encoding must specify prototypes.");
    }
    if (!("decoder" in specifier && "encode" in specifier)) {
        throw new SzrError("Multi-prototype specifier must have both decoder and encode.");
    }
    if (!specifier.key) {
        throw new SzrError("Multi-prototype specifier must provide a key.");
    }
    return specifier;
}

let packageObj;
try {
    packageObj = require("../../package.json");
} catch (err) {
    packageObj = require("./package.json");
}

// Based on lodash's implementation: https://github.com/lodash/lodash
export function _defaultsDeep(target: any, source: any) {
    target = Object(target);
    if (!source) return target;
    source = Object(source);
    for (const [key, value] of Object.entries(source)) {
        if (typeof target[key] === "object") {
            defaultsDeep(target[key], Object(value));
        } else {
            if (target[key] === undefined) {
                target[key] = value;
            }
        }
    }
    return target;
}

export function defaultsDeep(target: any, ...sources: any[]) {
    for (const source of sources) {
        target = _defaultsDeep(target, source);
    }
    return target;
}

export function getLibraryEncodingName(str: string) {
    return `Preszr/${str}`;
}

export function getImplicitSymbolEncodingName(str: string) {
    return getLibraryEncodingName(`symbol-${str}`);
}

export function getImplicitClassEncodingName(str: string) {
    return getLibraryEncodingName(`class-${str}`);
}

export function getClassName(proto: object): string | null | undefined {
    return proto[Symbol.toStringTag] ?? proto.constructor?.name;
}

export function getSymbolName(symb: symbol) {
    return symb.toString().slice(7, -1);
}

export function getUnrecognizedSymbolName(name: string) {
    return `preszr unknown: ${name}`;
}

export function getUnrecognizedSymbol(name: string) {
    return Symbol(getUnrecognizedSymbolName(name));
}

export const version = packageObj.version.split(".")[0];

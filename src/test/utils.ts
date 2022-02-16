import { SzrHeader, SzrFormat } from "../lib/data-types";
import { version } from "../lib/utils";
import { ExecutionContext, Macro } from "ava";
import { cloneDeep } from "lodash";
import { defaultConfig, Szr } from "../lib/core";
import { DecodeInitContext, EncodeContext } from "../lib/interface";

export function stringify(value: any) {
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    if (typeof value === "bigint") {
        return `${value}n`;
    }
    if (Object.is(value, -0)) {
    }
    return `${value}`;
}

export function getSpecialObject(obj?) {
    obj ??= {};
    Object.defineProperty(obj, "idProperty", {
        get() {},
    });
}

export function createSparseArray<T>(arrayLikeObj: Record<any, T>): T[] {
    const arr = [] as T[];
    for (const [key, value] of Object.entries(arrayLikeObj)) {
        arr[key] = value;
    }
    return arr;
}

export function embedSzrVersion(encoded) {
    encoded = cloneDeep(encoded);
    const encodingSpec = encoded[0].shift();
    encoded[0].unshift(version, ...getEncodingComponent(encodingSpec));
    return encoded;
}

export function getEncodingComponent(encodingSpec) {
    const encodingKeys = [] as string[];
    for (const [key, value] of Object.entries(encodingSpec) as any[]) {
        if (!encodingKeys.includes(value)) {
            encodingKeys.push(value);
        }
    }
    for (const [key, value] of Object.entries(encodingSpec) as any[]) {
        encodingSpec[key] = encodingKeys.indexOf(value);
    }

    return [encodingKeys, encodingSpec];
}

export function simplifyEncoding(encoding: SzrFormat) {
    const clone = cloneDeep(encoding);
    const [[vr, keys, info, meta]] = clone;
    for (const [k, v] of Object.entries(info)) {
        info[k] = keys[v];
    }
    clone[0].splice(1, 1);
    return clone;
}

export function createSzrRep([encodingSpec, meta], ...arr): SzrFormat {
    const header = [
        version,
        ...getEncodingComponent(encodingSpec),
        meta,
    ] as SzrHeader;
    return [header, ...arr];
}

export function szrDefaultHeader(...arr): SzrFormat {
    return createSzrRep([{}, {}], ...arr);
}

export function createWithTitle(macro, argsFunc, titleFunc) {
    const newMacro = (t, ...args) => macro(t, ...argsFunc(...args));
    newMacro.title = titleFunc;
    return newMacro;
}

const defaultSzr = new Szr();

export const testEncodeMacro: any = (
    t: ExecutionContext,
    decoded: any,
    encoded: any,
    szr = defaultSzr
) => {
    const rEncoded = szr.encode(decoded) as any;
    t.deepEqual(simplifyEncoding(rEncoded), simplifyEncoding(encoded));
};

export const testDecodeMacro: any = (
    t: ExecutionContext,
    decoded: any,
    encoded: any,
    szr = defaultSzr
) => {
    const rDecoded = szr.decode(encoded);
    t.deepEqual(rDecoded, decoded);
};

export const testEncodeMacroBindSzr = (szr) => (a, b, c) =>
    testEncodeMacro(a, b, c, szr);

export const testDecodeMacroBindSzr = (szr) => (a, b, c) =>
    testDecodeMacro(a, b, c, szr);

export const combAttachHeader = (titleFunc) => {
    const attachHeader = (decoded, encoded) => [
        decoded,
        szrDefaultHeader(...encoded),
    ];
    return [
        createWithTitle(
            testEncodeMacro,
            attachHeader,
            (title, ...args) => `encode:: ${title ?? titleFunc(...args)}`
        ),
        createWithTitle(
            testDecodeMacro,
            attachHeader,
            (title, ...args) => `decode:: ${title ?? titleFunc(...args)}`
        ),
    ] as [Macro<any>, Macro<any>];
};

export function getDummyCtx() {
    return {
        encode: (x) => x,
        decode: (x) => x,
    } as EncodeContext & DecodeInitContext;
}

export interface EncodeDecodeMacros {
    decode(t: ExecutionContext, decoded, encoded);

    encode(t: ExecutionContext, decoded, encoded);
}

export const encodeDecodeMacro = (args: EncodeDecodeMacros) => {
    return [
        createWithTitle(
            args.encode,
            (decoded, encoded, szr) => [decoded, embedSzrVersion(encoded), szr],
            (title) => `encode :: ${title}`
        ),
        createWithTitle(
            args.decode,
            (decoded, encoded, szr) => [decoded, embedSzrVersion(encoded), szr],
            (title) => `decode :: ${title}`
        ),
    ] as [any, any];
};

export function toBase64(buf: ArrayBuffer) {
    return Buffer.from(buf).toString("base64");
}

export function fromBase64(b64: string) {
    return Buffer.from(b64, "base64").buffer;
}

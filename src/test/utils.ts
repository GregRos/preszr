import { Header, PreszrFormat } from "../lib/data-types";
import { version } from "../lib/utils";
import { ExecutionContext, Macro } from "ava";
import { cloneDeep } from "lodash";
import { Preszr } from "../lib/core";
import { DecodeInitContext, EncodeContext } from "../lib";

export function stringify(value: any) {
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    if (typeof value === "bigint") {
        return `${value}n`;
    }
    if (Object.is(value, -0)) {
        return "-0";
    }
    return `${value}`;
}

export function createSparseArray<T>(arrayLikeObj: Record<any, T>): T[] {
    const arr = [] as T[];
    for (const [key, value] of Object.entries(arrayLikeObj)) {
        arr[key] = value;
    }
    return arr;
}

export function embedPreszrVersion(encoded) {
    encoded = cloneDeep(encoded);
    const encodingSpec = encoded[0].shift();
    encoded[0].unshift(version, ...getEncodingComponent(encodingSpec));
    return encoded;
}

export function getEncodingComponent(encodingSpec) {
    const encodingKeys = [] as string[];
    for (const [, value] of Object.entries(encodingSpec) as any[]) {
        if (!encodingKeys.includes(value)) {
            encodingKeys.push(value);
        }
    }
    for (const [key, value] of Object.entries(encodingSpec) as any[]) {
        encodingSpec[key] = encodingKeys.indexOf(value);
    }

    return [encodingKeys, encodingSpec];
}

export function simplifyEncoding(encoding: PreszrFormat) {
    const clone = cloneDeep(encoding);
    const [[, keys, info]] = clone;
    for (const [k, v] of Object.entries(info)) {
        info[k] = keys[v];
    }
    clone[0].splice(1, 1);
    return clone;
}

export function createPreszrRep([encodingSpec, meta], ...arr): PreszrFormat {
    const header = [
        version,
        ...getEncodingComponent(encodingSpec),
        meta,
    ] as Header;
    return [header, ...arr];
}

export function preszrDefaultHeader(...arr): PreszrFormat {
    return createPreszrRep([{}, {}], ...arr);
}

export function createWithTitle(macro, argsFunc, titleFunc) {
    const newMacro = (t, ...args) => macro(t, ...argsFunc(...args));
    newMacro.title = titleFunc;
    return newMacro;
}

const defaultPreszr = new Preszr();

export const testEncodeMacro: any = (
    t: ExecutionContext,
    decoded: any,
    encoded: any,
    preszr = defaultPreszr
) => {
    const rEncoded = preszr.encode(decoded) as any;
    t.deepEqual(simplifyEncoding(rEncoded), simplifyEncoding(encoded));
};

export const testDecodeMacro: any = (
    t: ExecutionContext,
    decoded: any,
    encoded: any,
    preszr = defaultPreszr
) => {
    const rDecoded = preszr.decode(encoded);
    t.deepEqual(rDecoded, decoded);
};

export const testEncodeMacroBindPreszr = (preszr) => (a, b, c) =>
    testEncodeMacro(a, b, c, preszr);

export const testDecodeMacroBindPreszr = (preszr) => (a, b, c) =>
    testDecodeMacro(a, b, c, preszr);

export const combAttachHeader = (titleFunc) => {
    const attachHeader = (decoded, encoded) => [
        decoded,
        preszrDefaultHeader(...encoded),
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
            (decoded, encoded, preszr) => [decoded, embedPreszrVersion(encoded), preszr],
            (title) => `encode :: ${title}`
        ),
        createWithTitle(
            args.decode,
            (decoded, encoded, preszr) => [decoded, embedPreszrVersion(encoded), preszr],
            (title) => `decode :: ${title}`
        ),
    ] as [any, any];
};

export function toBase64(buf: ArrayBuffer) {
    return Buffer.from(buf).toString("base64");
}

import {SzrMetadata, SzrRepresentation} from "../lib/szr-representation";
import {version} from "../lib/utils";
import {ExecutionContext, Macro} from "ava";
import {decode, encode} from "../lib";
import { cloneDeep } from "lodash";

export function stringify(value: any) {
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    if (typeof value === "bigint") {
        return `${value}n`;
    }
    if (Object.is(value, -0)) {}
    return `${value}`;
}

export function getSpecialObject(obj?) {
    obj ??= {};
    Object.defineProperty(obj, "idProperty", {
        get() {

        }
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
    encoded[0].unshift(version);
    return encoded;
}

export function createSzrRep([encodings, meta], ...arr): SzrRepresentation {
    const metadata = [version, encodings, meta] as SzrMetadata;
    return [metadata, ...arr];
}

export function szrDefaultMetadata(...arr): SzrRepresentation {
    return createSzrRep([{}, {}], ...arr);
}

export function createWithTitle(macro, argsFunc, titleFunc) {
    const newMacro = (t, ...args) => macro(t, ...argsFunc(...args));
    newMacro.title = titleFunc;
    return newMacro;
}

export const testEncodeMacro: any = (t: ExecutionContext, decoded: any, encoded: any) => {
    const rEncoded = encode(decoded) as any;
    t.deepEqual(rEncoded, encoded);
};
export const testDecodeMacro: any = (t: ExecutionContext, decoded: any, encoded: any) => {
    const rDecoded = decode(encoded);
    t.deepEqual(rDecoded, decoded);
};
export const combAttachMetadata = titleFunc => {
    const attachMetadata = (decoded, encoded) => [decoded, szrDefaultMetadata(...encoded)];
    return [
        createWithTitle(
            testEncodeMacro,
            attachMetadata,
            (title, ...args) => `encode:: ${title ?? titleFunc(...args)}`
        ),
        createWithTitle(
            testDecodeMacro,
            attachMetadata,
            (title, ...args) => `decode:: ${title ?? titleFunc(...args)}`
        )
    ] as [Macro<any>, Macro<any>];
};


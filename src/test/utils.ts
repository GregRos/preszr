import {SzrMetadata, SzrRepresentation} from "../lib/szr-representation";
import {version} from "../lib/utils";
import {ExecutionContext, Macro} from "ava";
import {cloneDeep} from "lodash";
import {defaultConfig, Szr} from "../lib/szr";
import {DecodeInitContext, EncodeContext} from "../lib/szr-interface";

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

const defaultSzr = new Szr();

export const testEncodeMacro: any = (t: ExecutionContext, decoded: any, encoded: any, szr = defaultSzr) => {
    const rEncoded = szr.encode(decoded) as any;
    t.deepEqual(rEncoded, encoded);
};
export const testEncodeMacroBindSzr = szr => (a, b, c) => testEncodeMacro(a, b, c, szr);

export const testDecodeMacro: any = (t: ExecutionContext, decoded: any, encoded: any, szr = defaultSzr) => {
    const rDecoded = szr.decode(encoded);
    t.deepEqual(rDecoded, decoded);
};

export const testDecodeMacroBindSzr = szr => (a, b, c) => testDecodeMacro(a, b, c, szr);


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

export function getDummyCtx() {
    return {
        ref: x => x,
        options: defaultConfig.options,
        deref: x => x
    } as EncodeContext & DecodeInitContext;
}

export interface EncodeDecodeMacros {
    decode(t: ExecutionContext, decoded, encoded);

    encode(t: ExecutionContext, decoded, encoded);
}

export const encodeDecodeMacro = (args: EncodeDecodeMacros) => {
    return [
        createWithTitle(args.encode, (decoded, encoded, szr) => [decoded, embedSzrVersion(encoded), szr], title => `encode :: ${title}`),
        createWithTitle(args.decode, (decoded, encoded, szr) => [decoded, embedSzrVersion(encoded), szr], title => `decode :: ${title}`)
    ] as [any, any];
};

export function toBase64(buf: ArrayBuffer) {
    return Buffer.from(buf).toString("base64");
}

export function fromBase64(b64: string) {
    return Buffer.from(b64, "base64").buffer;
}

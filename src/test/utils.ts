import {SzrMetadata, SzrRepresentation} from "../lib/szr-representation";
import {version} from "../lib/utils";

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

export function createSzrRep([encodings, meta], ...arr): SzrRepresentation {
    const metadata = [version, encodings, meta] as SzrMetadata;
    return [metadata, ...arr];
}

export function szrDefaultMetadata(...arr): SzrRepresentation {
    return createSzrRep([{}, {}], ...arr);
}

export function createWithTitle(macro, argsFunc, titleFunc) {
    const newMacro = (...args) => macro(...argsFunc(...args));
    newMacro.title = titleFunc;
    return newMacro;
}

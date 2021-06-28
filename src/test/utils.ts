import {SzrOutput} from "../lib/szr-representation";
import test, {Macro} from "ava";
import {decode, encode} from "../lib";
import {Szr} from "../lib/szr";

export function stringify(value: any) {
    if (typeof value === "bigint") {
        return `${value}n`;
    }
    return `${value}`;
}

export function getSpecialObject(obj?) {
    obj ??= {};
    Object.defineProperty(obj, "idProperty", {
        get() {

        }
    });
}

export function getSparseArray(arrayLikeObj: Record<number, any>) {
    const arr = [];
    for (const [key, value] of Object.entries(arrayLikeObj)) {
        arr[key] = value;
    }
    return arr;
}

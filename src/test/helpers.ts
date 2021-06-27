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

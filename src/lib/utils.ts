
// @ts-ignore
import * as pkgJson from "../../package.json";

export function defaults(target: any, source: any) {
    target = Object(target);
    if (!source) return target;
    source = Object(source);
    for (const [key, value] of Object.entries(source)) {
        if (source[key] === undefined) {
            target[key] = value;
        }
    }
}

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

export function getRandomizedEncodedString(str: string) {
    const rnd = Math.random() * 100_000 | 0;
    return `${getEncodedString(str)}-${rnd.toString(36)}`;

}

export function getEncodedString(str: string) {
    return `!@#szr-${str}`;
}



export const version = /^\d*.\d*/.exec(pkgJson.version)![0];

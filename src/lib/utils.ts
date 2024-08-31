import { BasicSpecifier } from "./interface"

export function cloneDeep<T>(source: T): T {
    if (typeof source !== "object" || !source) {
        return source
    }
    if (Array.isArray(source)) {
        return source.map(x => cloneDeep(x)) as any
    }
    const newObj = Object.create(Object.getPrototypeOf(source))
    for (const key of Object.keys(source)) {
        newObj[key] = cloneDeep((source as any)[key])
    }
    return newObj
}

// Based on lodash's implementation: https://github.com/lodash/lodash
function _defaultsDeep(target: any, source: any) {
    target = Object(target)
    if (!source) return target
    source = Object(source)
    for (const key of Object.keys(source)) {
        const value = source[key]
        if (typeof target[key] === "object") {
            defaultsDeep(target[key], Object(value))
        } else {
            if (target[key] === undefined) {
                target[key] = value
            }
        }
    }
    return target
}

export function defaultsDeep(target: any, ...sources: any[]) {
    for (const source of sources) {
        target = _defaultsDeep(target, source)
    }
    return target
}

export function maxBy<T>(target: T[], projection: (x: T, n: number) => number) {
    if (target.length === 0) {
        return undefined
    }
    let maxProjected = projection(target[0], 0)
    let maxIndex = 0
    for (let i = 1; i < target.length; i++) {
        const curProjected = projection(target[i], i)
        if (curProjected > maxProjected) {
            maxProjected = curProjected
            maxIndex = i
        }
    }
    return target[maxIndex]
}

export function flatten<T>(arrs: T[][]) {
    return ([] as T[]).concat(...arrs)
}

export function isNumericString(input: string) {
    return +input === parseInt(input)
}

export function getBuiltInEncodingName(str: string) {
    return `/${str}`
}

export function getImplicitClassEncodingName(str: string) {
    return str
}

export function getClass(protoOrCtor: Function | object) {
    return typeof protoOrCtor === "function" ? protoOrCtor : protoOrCtor.constructor
}

export function getProto(protoOrCtor: Function | object) {
    return typeof protoOrCtor === "function" ? protoOrCtor.prototype : protoOrCtor
}

export function isReference(x: string) {
    return !Array.isArray(x) && +x === parseInt(x)
}

export function getEncodesName(proto: object | null | Function | symbol) {
    return proto === null
        ? "null"
        : typeof proto === "function"
          ? getCtorName(proto)
          : typeof proto === "symbol"
            ? getSymbolName(proto)
            : getProtoName(proto)
}

export function getProtoName(proto: object | null) {
    return proto === null ? "null" : ((proto as any)[Symbol.toStringTag] ?? proto.constructor.name)
}

export function getCtorName(ctor: Function) {
    return ctor.name
}

export function getThingName(anything: any) {
    return anything === null
        ? "null"
        : typeof anything === "function" || typeof anything === "object"
          ? getClassName(anything)
          : typeof anything === "symbol"
            ? getSymbolName(anything)
            : typeof anything
}

export function getClassName(protoOrCtor: Function | object | null): string | null | undefined {
    return protoOrCtor === null ? "null" : (getClass(protoOrCtor)?.name ?? "???")
}

export function getSymbolName(symb: symbol) {
    return symb.toString().slice(7, -1)
}

export function getUnrecognizedSymbolName(name: string) {
    return `preszr unknown: ${name}`
}

export function getUnrecognizedSymbol(name: string) {
    return Symbol(getUnrecognizedSymbolName(name))
}

export function isObject(x: any): x is object {
    return typeof x === "object" && x !== null
}

export function isFunction(x: any): x is Function {
    return typeof x === "function"
}

export function isString(x: any): x is string {
    return typeof x === "string"
}

export function isSimpleEncodingSpec(candidate: unknown): candidate is BasicSpecifier<any> {
    return typeof candidate === "symbol" || typeof candidate === "function"
}

export function setsEqual(a: Set<any> | any[], b: typeof a) {
    a = a instanceof Set ? a : new Set(a)
    b = b instanceof Set ? b : new Set(b)
    if (a.size !== b.size) {
        return false
    }
    for (const item in a) {
        if (!b.has(item)) {
            return false
        }
    }
    return true
}

export { version } from "./version"

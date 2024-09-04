import { Preszr as PreszrClass } from "./core"
import { PreszrOutput } from "./data"
import { defaultPreszr } from "./default"
import {
    PreszrConfig,
    type CtorSpecifier,
    type PrototypeSpecifier,
    type SymbolSpecifier
} from "./interface"

export {
    CreateContext,
    Decoder,
    EncodeContext,
    Encoding,
    EncodingSpecifier,
    InitContext,
    PreszrConfig,
    PrototypeEncoding,
    PrototypeSpecifier,
    SymbolSpecifier
} from "./interface"

/**
 * Encodes a value using preszr with the default settings.
 *
 * @param value A value to encode.
 */
export const encode = (value: unknown): PreszrOutput => defaultPreszr.encode(value)

/**
 * Decodes a value using preszr with the default settings.
 *
 * @param encoded The default
 */
export const decode = <T = unknown>(encoded: PreszrOutput): T => defaultPreszr.decode(encoded) as T

type SpecArray<Ts extends any[]> = {
    [K in keyof Ts]: Ts[K] extends null | object
        ? PrototypeSpecifier<Ts[K]> | CtorSpecifier<Ts[K]>
        : Ts[K] extends symbol
          ? Ts[K] | SymbolSpecifier<Ts[K]>
          : never
}
/**
 * Creates a new `Preszr` instance. Can be called with or without `new`.
 *
 * @class
 * @param config The configuration. Should be the same in the source and destination.
 */
export const Preszr = function Preszr(arg: any) {
    if (Array.isArray(arg)) {
        return new PreszrClass({
            encodes: arg
        })
    }
    return new PreszrClass(arg ?? {})
} as unknown as {
    <Ts extends any[]>(specs: SpecArray<Ts>): Preszr
    <Ts extends any[]>(config: Partial<PreszrConfig<SpecArray<Ts>>>): Preszr
    (): Preszr
    new <Ts extends any[]>(specs: SpecArray<Ts>): Preszr
    new (): Preszr
    new <Ts extends any[]>(config: Partial<PreszrConfig<SpecArray<Ts>>>): Preszr
}

/** A configured Preszr instance used for encoding and decoding. */
export type Preszr = PreszrClass
Preszr.prototype = PreszrClass.prototype

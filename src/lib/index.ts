import { Preszr as PreszrClass } from "./core";
import { PreszrOutput } from "./data";
import {
    DeepPartial,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EncodingSpecifier,
    PreszrConfig
} from "./interface";
import { defaultPreszr } from "./default";

export {
    Encoding,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeSpecifier,
    Decoder,
    SymbolSpecifier,
    CreateContext,
    InitContext,
    DeepPartial,
    PreszrConfig,
    EncodeContext
} from "./interface";

/**
 * Encodes a value using preszr with the default settings.
 * @param value A value to encode.
 */
export const encode = (value: unknown): PreszrOutput =>
    defaultPreszr.encode(value);

/**
 * Decodes a value using preszr with the default settings.
 * @param encoded The default
 */
export const decode = <T = unknown>(encoded: PreszrOutput): T =>
    defaultPreszr.decode(encoded) as T;

/**
 * Creates a new `Preszr` instance. Can be called with or without `new`.
 * @param config The configuration. Should be the same in the source and destination.
 * @constructor
 */
export const Preszr = function Preszr(arg: any) {
    if (Array.isArray(arg)) {
        return new PreszrClass({
            encodes: arg,
            unsupported: []
        });
    }
    return new PreszrClass(arg);
} as unknown as {
    new (specs: EncodingSpecifier[]): Preszr;
    /**
     * Creates a new `Preszr` instance. Can be called with or without `new`.
     * @param config The configuration. Should be the same in the source and destination.
     * @constructor
     */
    new (config?: DeepPartial<PreszrConfig>): Preszr;

    /**
     * Creates a new `Preszr` instance. Can be called with or without `new`.
     * @param config The configuration. Should be the same in the source and destination.
     * @constructor
     */
    (config?: DeepPartial<PreszrConfig>): Preszr;

    (specs: EncodingSpecifier[]): Preszr;
};

/**
 * A configured Preszr instance used for encoding and decoding.
 */
export type Preszr = PreszrClass;
Preszr.prototype = PreszrClass.prototype;

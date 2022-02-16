import { Preszr as PreszrClass } from "./core";
import { PreszrOutput } from "./data-types";
import { DeepPartial, PreszrConfig } from "./interface";

export {
    Encoding,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeEncodingSpecifier,
    Decoder,
    SymbolEncoding,
    DecodeCreateContext,
    DecodeInitContext,
    DeepPartial,
    PreszrConfig,
    EncodeContext,
} from "./interface";
const defaultPreszr = new PreszrClass();

/**
 * Encodes a value using preszr with the default settings.
 * @param value A value to encode.
 */
export const encode = (value: unknown): PreszrOutput => defaultPreszr.encode(value);

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
export const Preszr = function Preszr(config?: DeepPartial<PreszrConfig>) {
    return new PreszrClass(config);
} as unknown as {
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
};

/**
 * A configured Preszr instance used for encoding and decoding.
 */
export type Preszr = PreszrClass;
Preszr.prototype = PreszrClass.prototype;

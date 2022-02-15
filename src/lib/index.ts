import { Szr as SzrClass } from "./core";
import { SzrOutput } from "./data-types";
import { DeepPartial, SzrConfig } from "./interface";

export {
    SzrEncoding,
    SzrEncodingSpecifier,
    SzrPrototypeEncoding,
    SzrPrototypeSpecifier,
    Decoder,
    SzrSymbolEncoding,
    DecodeCreateContext,
    DecodeInitContext,
    DeepPartial,
    SzrConfig,
    EncodeContext
} from "./interface";
const defaultSzr = new SzrClass();

/**
 * Encodes a value using szr with the default settings.
 * @param value A value to encode.
 */
export const encode = (value: unknown): SzrOutput => defaultSzr.encode(value);

/**
 * Decodes a value using szr with the default settings.
 * @param encoded The default
 */
export const decode = <T = unknown>(encoded: SzrOutput): T => defaultSzr.decode(encoded) as T;

/**
 * Creates a new `Szr` instance. Can be called with or without `new`.
 * @param config The configuration. Should be the same in the source and destination.
 * @constructor
 */
export const Szr = function Szr(config?: DeepPartial<SzrConfig>) {
    return new SzrClass(config);
} as unknown as {
    /**
     * Creates a new `Szr` instance. Can be called with or without `new`.
     * @param config The configuration. Should be the same in the source and destination.
     * @constructor
     */
    new(config?: DeepPartial<SzrConfig>): Szr;

    /**
     * Creates a new `Szr` instance. Can be called with or without `new`.
     * @param config The configuration. Should be the same in the source and destination.
     * @constructor
     */
    (config?: DeepPartial<SzrConfig>): Szr;

};

/**
 * A configured Szr instance used for encoding and decoding.
 */
export type Szr = SzrClass;
Szr.prototype = SzrClass.prototype;


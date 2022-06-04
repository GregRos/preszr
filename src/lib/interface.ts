import { EncodedEntity, ScalarValue } from "./data";
import { PreszrError } from "./errors";
import { makeWrapperEncoding } from "./encodings/scalar";

export const fixedIndexProp = Symbol("fixedIndex");

/**
 * The context used by the encoding process.
 */
export interface EncodeContext {
    /**
     * Encodes the given input. For entities, it will recursively encode them, add
     * them to the final output as a side effect, and return a reference. For other
     * values, it will return them as-is or encode them, usually as a string.
     * @param value
     */
    encode(value: any): ScalarValue;

    /**
     * For internal use only.
     */
    _isImplicit: boolean;

    /**
     * Sets the metadata for this entity. The metadata can be any JSON-legal value,
     * including an object. It doesn't do anything, but can be accessed while decoding.
     */
    metadata: any;
}

/**
 * The context used by the create stage of the decoding process. Only
 * exposes the entity's metadata.
 */
export interface CreateContext {
    // The metadata for this encoded entity.
    metadata: any;
}

/**
 * The context used by the init stage of the decoding process. Allows
 * resolving references to other entities.
 */
export interface InitContext {
    metadata: any;

    // Resolves references and decodes encoded scalars. This isn't a recursive call.
    decode(value: ScalarValue): unknown;
}

/**
 * The decoding logic for a prototype encoding.
 */
export interface Decoder {
    // Creates an instance of the entity without referencing any other encoded entities.
    create(encoded: EncodedEntity, ctx: CreateContext): unknown;

    // Fills in additional data by resolving references to other entities.
    init?(target: unknown, encoded: EncodedEntity, ctx: InitContext): void;
}

/**
 * Specifies a prototype encoding. Missing fields will be filled in automatically.
 */
export interface PrototypeSpecifier {
    // The key of the encoding. Must be unique. Will be inferred from the prototype if missing.
    name?: string | null;
    // Optionally, a 0-based version number. If not supplied, defaults to 0.
    version?: number;
    // The prototype or constructor.
    encodes: object | Function;
    // The decoding logic. If missing, the default decoding will be used, which will fill in
    // the object's properties and attach the correct prototype.
    decoder?: Decoder;
    // The encoding logic. If missing, the default encode function will be used, which
    // will iterate over the object's own enumerable properties and recursively encode them.
    encode?(input: any, ctx: EncodeContext): EncodedEntity;
}

/**
 * This special encoding is used to encode missing symbols.
 */
export interface SpecialEncoding {
    name: string;
    [fixedIndexProp]?: number;
    metadata?: any;
}

/**
 * A full symbol encoding.
 */
export interface SymbolEncoding {
    name: string;
    symbol: symbol;
    [fixedIndexProp]?: number;
}

/**
 * A full prototype encoding.
 */
export interface PrototypeEncoding {
    version: number;
    // Encodings can be for several different prototypes, but this is mostly undocumented and
    // should only be used internally.
    protos: object[];
    decoder: Decoder;
    encode(input: any, ctx: EncodeContext): EncodedEntity;
    // If this is set, the encoding has a fixed index and doesn't need
    // to appear in the encoding keys list. It only needs to appear in the
    // encoding spec map. It makes referencing it faster and message size smaller
    // but makes it position-dependent, fragile, and unusable for versioning.
    // This is only suitable for core encodings.
    [fixedIndexProp]?: number;
    name: string;
}

/**
 * A full preszr encoding of any type.
 */
export type Encoding = PrototypeEncoding | SymbolEncoding | SpecialEncoding;

/**
 * These encodings specifiers can't be confused for configuration objects or
 * prototypes.
 */
export type BasicSpecifier = symbol | Function;

export type NonOverrideSpecifier =
    | BasicSpecifier
    | PrototypeSpecifier
    | PrototypeEncoding
    | SymbolEncoding;

/**
 * An encoding specifier. Can be a symbol or constructor for a shorthand
 * symbol or prototype encoding. You can also give symbol or prototype encoding specifier
 * if you want to be more explicit.
 */
export type EncodingSpecifier =
    | BasicSpecifier
    | PrototypeSpecifier
    | PrototypeEncoding
    | SymbolEncoding;

/**
 * Configuration for an Preszr instance.
 */
export interface PreszrConfig {
    /**
     * An array of encoding specifiers. If you put your constructors and symbols here,
     * the Preszr will recognize them.
     */
    encodes: EncodingSpecifier[];
    /**
     * An array of constructors that will be marked as unsupported.
     * Objects with these constructors will not be encoded.
     */
    unsupported: Function[];
}

/**
 * Similar to Partial<T>, but recursively applied.
 */
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

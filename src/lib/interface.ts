import { EncodedEntity, ScalarValue } from "./data";

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
export interface InitContext extends CreateContext {
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
export interface PrototypeEncodingSpecifier {
    // The key of the encoding. Must be unique. Will be inferred from the prototype if missing.
    name?: string;
    // Optionally, a 1-based version number. If not supplied, defaults to 0.
    version?: number;
    // The prototype. Required.
    prototype: object | null;
    // The decoding logic. If missing, the default decoding will be used, which will fill in
    // the object's properties and attach the correct prototype.
    decoder?: Decoder;
    // The encoding logic. If missing, the default encode function will be used, which
    // will iterate over the object's own enumerable properties and recursively encode them.
    encode?(input: any, ctx: EncodeContext): EncodedEntity;
}

/**
 * A full symbol encoding.
 */
export interface SymbolEncoding {
    name: string;
    symbol: symbol;
    metadata?: any;
}

/**
 * A full prototype encoding.
 */
export interface PrototypeEncoding {
    name: string;
    version: number;
    // If this is set, the encoding has a fixed index and doesn't need
    // to appear in the encoding keys list. It only needs to appear in the
    // encoding spec map. It makes referencing it faster but makes it position-dependent.
    fixedIndex?: number;
    prototypes: object[];
    decoder: Decoder;
    encode(input: any, ctx: EncodeContext): EncodedEntity;
}

/**
 * A full preszr encoding of any type.
 */
export type Encoding = PrototypeEncoding | SymbolEncoding;

/**
 * An encoding specifier. Can be a symbol or constructor for a shorthand
 * symbol or prototype encoding. You can also give symbol or prototype encoding specifier
 * if you want to be more explicit.
 */
export type EncodingSpecifier =
    | symbol
    | Function
    | PrototypeEncodingSpecifier
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
    encodings: EncodingSpecifier[];
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

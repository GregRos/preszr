import { EncodedEntity, ScalarValue } from "./data";
import { getPrototypeName, getSymbolName } from "./utils";
import { getErrorByCode } from "./errors/texts";

/**
 * The context used by the encoding process.
 */
export interface EncodeContext {
    readonly self: PrototypeEncoding;
    /**
     * Encodes the given input. For entities, it will recursively encode them, add
     * them to the final output as a side effect, and return a reference. For other
     * values, it will return them as-is or encode them, usually as a string.
     * @param value The value to encode.
     * @param prevRealm If true, the value will be encoded into the previous realm.
     */
    encode(value: any, prevRealm?: boolean): ScalarValue;

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

export type Option<T> =
    | undefined
    | {
          value: T;
      };

/**
 * The context used by the create stage of the decoding process. Only
 * exposes the entity's metadata.
 */
export interface CreateContext {
    /**
     * The encoding that's being executed.
     */
    readonly self: PrototypeEncoding;
    /**
     * Read the metadata value for the entity.
     */
    readonly metadata: any;
}

/**
 * The context used by the init stage of the decoding process. Allows
 * resolving references to other entities.
 */
export interface InitContext {
    metadata: any;
    self: PrototypeEncoding;

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
 * A full symbol encoding.
 */
export interface SymbolSpecifier {
    name: string;
    encodes: symbol;
}

/**
 * A full preszr encoding of any type.
 */
export type Encoding = SymbolEncoding | PrototypeEncoding<object>;
/**
 * These encodings specifiers can't be confused for configuration objects or
 * prototypes.
 */
export type BasicSpecifier = symbol | Function;

/**
 * An encoding specifier. Can be a symbol or constructor for a shorthand
 * symbol or prototype encoding. You can also give symbol or prototype encoding specifier
 * if you want to be more explicit.
 */
export type EncodingSpecifier =
    | BasicSpecifier
    | PrototypeSpecifier
    | SymbolSpecifier;

/**
 * Configuration for an Preszr instance.
 */
export interface PreszrConfig {
    /**
     * An array of encoding specifiers. If you put your constructors and symbols here,
     * the Preszr will recognize them.
     */
    encodes: EncodingSpecifier[];
}

export abstract class BaseEncoding {
    abstract readonly name: string;
    abstract readonly fixedIndex?: number;
    abstract readonly key: string;
    protected abstract _toString(): string;

    get [Symbol.toStringTag]() {
        return this._toString();
    }

    toString() {
        return this[Symbol.toStringTag];
    }
}

export class SymbolEncoding extends BaseEncoding {
    constructor(
        public readonly name: string,
        public readonly encodes: symbol,
        public readonly fixedIndex?: number,
        public readonly metadata?: any
    ) {
        super();
    }

    protected _toString(): string {
        return `[PreszrSymbolEncoding "${this.name}" ${getSymbolName(
            this.encodes
        )}]`;
    }

    get key() {
        return `${this.name}.S`;
    }

    static fromSymbol(s: symbol) {
        const name = getSymbolName(s);
        if (!name) {
            throw getErrorByCode("config/symbol/no-name")(s);
        }
        return new SymbolEncoding(name, s);
    }

    static fromSpecifier(spec: SymbolSpecifier) {
        if (!spec.encodes) {
            throw getErrorByCode("config/spec/no-encodes")();
        }
        const name = spec.name ?? getSymbolName(spec.encodes);
        if (!name) {
            throw getErrorByCode("config/symbol/no-name")(spec.encodes);
        }

        return new SymbolEncoding(name, spec.encodes);
    }
}

export class PreszrUnsupportedValue {
    constructor(public readonly type: string) {}
}

export abstract class PrototypeEncoding<
    T extends { constructor: Function } = object
> extends BaseEncoding {
    public abstract readonly name: string;
    public abstract readonly version: number;
    public abstract readonly encodes: T;
    public abstract readonly fixedIndex?: number;

    abstract encode(x: T, ctx: EncodeContext): EncodedEntity;

    abstract decoder: Decoder;

    get key() {
        return `${this.name}.v${this.version}`;
    }

    protected _toString(): string {
        return `[PreszrPrototypeEncoding "${this.name}@${
            this.version
        }" ${getPrototypeName(this.encodes)}]`;
    }

    mustBeCompatible(other: PrototypeEncoding) {
        if (this.encodes !== other.encodes) {
            throw getErrorByCode("config/proto/proto-collision")(other, this);
        }
        if (this.name !== other.name) {
            throw getErrorByCode("config/proto/name-collision")(other, this);
        }
        if (this.fixedIndex !== other.fixedIndex) {
            throw getErrorByCode("bug/config/fixed-index-collision")(
                this,
                other
            );
        }
    }
}

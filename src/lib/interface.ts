import { EncodedEntity, EncodedScalar, Reference, ScalarValue } from "./data";
import { getPrototypeName, getSymbolName } from "./utils";
import { getErrorByCode } from "./errors/texts";

/**
 * The context used by the encoding process.
 */
export interface EncodeContext {
    readonly self: PrototypeEncoding;

    /**
     * Encodes the given input. For entities, it will recursively encode them, add
     * them to the final output as a side effect (if not already), and return a reference. For other
     * values, it will return them as-is or encode them, usually as a string.
     * @param value The value to encode.
     */
    encode(value: any): ScalarValue;

    /**
     * If true, encoding metadata for the current node won't be written. Used internally.
     * @private
     */
    _isImplicit: boolean;

    /**
     * Sets the metadata for this entity. The metadata can be any JSON-legal value,
     * including an object. It doesn't do anything, but can be accessed while decoding.
     */
    metadata: any;
}

/**
 * The context used for the REQUIREMENTS phase of encoding an object.
 */
export interface RequirementsContext {
    /**
     * The encoding current executing.
     */
    readonly self: PrototypeEncoding;

    /**
     * Encodes any entities before the object that's in its REQUIREMENTS phase.
     * @param values The value(s) to require. Any non-entities are ignored.
     */
    require(...values: unknown[]): void;
}

export type EncodeFunction<T> = (input: T, ctx: EncodeContext) => any;

export interface Encoder<T> {
    /**
     * A REQUIREMENTS phase lets you require objects that must be decoded before
     * `value` can be decoded. It means they will be available to decode
     * via `decodeUnsafe` during the CREATE stage.
     *
     * This phase happens before an object is added to the entity stream, meaning that
     * anything encoded before REQUIREMENTS finishes is guaranteed to appear before it
     * in the stream.
     *
     * Objects can be encoded into the stream by calling `ctx.require`, which does the
     * same thing as `ctx.encode`. Like `ctx.encode`, it will recurse.  This will cause
     * more encoders to be called. Some might have a REQUIREMENTS phase of their own,
     * which is fine.
     *
     * However, if at any point an object in the REQUIREMENTS phase is the target of
     * `ctx.encode` or `ctx.require` (determined by ref), an error is thrown.
     * That's because an object ends up *requiring* itself, and would need to appear
     * before itself in the stream, which is not supported.
     *
     * The REQUIREMENTS phase is needed to decode objects that require other objects
     * before they are constructed, like `Uint8Array` which may require an `ArrayBuffer`.
     *
     * However, it creates much more fragile encoders, since they make some cycles illegal.
     * It's not meant to be used from user code.
     *
     * @param value The value being encoded.
     * @param ctx A context for the REQUIREMENTS phase.
     */
    requirements?(value: T, ctx: RequirementsContext): void;

    /**
     * Encodes the given value and returns a scalar of some sort.
     * @param input The value to encode.
     * @param ctx The encode context, which can be used to encode child values.
     */
    encode(input: T, ctx: EncodeContext): EncodedEntity;
}

/**
 * The context used by the CREATE stage of the decoding process. Only
 * exposes the entity's metadata.
 */
export interface CreateContext {
    /**
     * The encoding that's being executed.
     */
    readonly self: PrototypeEncoding;

    /**
     * Will return a decoded form of `scalar`. Will resolve references
     * **only** to objects that have been already been CREATED. If it receives
     * a reference to an object that hasn't been CREATED it will throw.
     *
     * Not meant to be used from user code.
     * @internal
     * @param scalar Scalar to decode
     */
    decodeUnsafe(scalar: ScalarValue): any;

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
    // Optionally, a safe, positive integer. Defaults to 1.
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
export type Encoding = SymbolEncoding | PrototypeEncoding<any>;
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

    abstract encoder: Encoder<T>;

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

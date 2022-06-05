import { EncodedEntity, ScalarValue } from "./data";
import { PreszrError } from "./errors";
import { getBuiltInEncodingName, getSymbolName, setsEqual } from "./utils";
import { Fixed } from "./encodings/fixed";

const MAX_VERSION = 999;
const MIN_VERSION = 0;
export const fixedIndexProp = Symbol("fixedIndex");

/**
 * The context used by the encoding process.
 */
export interface EncodeContext {
    readonly self: PrototypeEncoding;

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
    self: PrototypeEncoding;
    // The metadata for this encoded entity.
    metadata: any;
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

export type EncodeFunction<T> = (x: T, ctx: EncodeContext) => EncodedEntity;

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
    symbol: symbol;
}

/**
 * A full preszr encoding of any type.
 */
export type Encoding =
    | SymbolEncoding
    | PrototypeEncoding<any>
    | SpecialEncoding;

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

export abstract class BaseEncoding {
    abstract readonly name: string;
    abstract readonly fixedIndex?: number;
    abstract readonly key: string;
}

export class SymbolEncoding extends BaseEncoding {
    constructor(
        public readonly name: string,
        public readonly symbol: symbol,
        public readonly fixedIndex?: number
    ) {
        super();
    }

    get key() {
        return `${this.name}.S`;
    }

    static fromSymbol(s: symbol) {
        const name = getSymbolName(s);
        if (!name) {
            throw new PreszrError(
                "Configuration",
                `Symbol has no name. You must specify a full symbol encoding with a 'name' property.`
            );
        }
        return new SymbolEncoding(name, s);
    }

    static fromSpecifier(spec: SymbolSpecifier) {
        if (!spec.symbol) {
            throw new PreszrError(
                "Configuration",
                "You must have a 'symbol' property in a symbol encoding."
            );
        }
        if (typeof spec.symbol !== "symbol") {
            throw new PreszrError(
                "Configuration",
                `The 'symbol' property must be a symbol, and not a ${typeof spec.symbol}.`
            );
        }
        const name = spec.name ?? getSymbolName(spec.symbol);
        if (!name) {
            throw new PreszrError(
                "Configuration",
                `Symbol has no description. Add a 'name' property.`
            );
        }

        return new SymbolEncoding(name, spec.symbol);
    }
}

function mustBeValidPrototype(proto: object) {
    if (proto === undefined) {
        throw new PreszrError(
            "Configuration",
            "Prototype cannot be undefined."
        );
    }
    if (typeof proto !== "object" && typeof proto !== "function") {
        throw new PreszrError(
            "Configuration",
            `One of prototypes/constructors are something else. Here is a printout: ${typeof proto}`
        );
    }
}

export class PreszrUnsupportedValue {
    constructor(public readonly type: string) {}
}

export abstract class PrototypeEncoding<
    T extends object = object
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

    checkCompatible(other: PrototypeEncoding) {
        if (this.encodes !== other.encodes) {
            throw new PreszrError(
                "Configuration",
                `${this.key} and ${other.key} encode different prototypes, but have the same name.`
            );
        }
        if (this.name !== other.name) {
            throw new PreszrError(
                "Configuration",
                `${this.key} and ${other.key} encode the same prototypes, but have different names.`
            );
        }
        if (this.fixedIndex !== other.fixedIndex) {
            throw new PreszrError(
                "Configuration",
                `${this.key} [${this.fixedIndex}] and ${other.key} [${other.fixedIndex}] are the same, but they have different fixed indexes.`
            );
        }
    }

    validate() {
        mustBeValidPrototype(this.encodes);
        if (!this.name) {
            throw new PreszrError(
                "Bug",
                "Multi-prototype specifier must provide a name."
            );
        }
        if (!this.decoder) {
            throw new PreszrError(
                "Bug",
                "Multi-prototype specifier must provide a decoder object."
            );
        }
        if (!this.encode) {
            throw new PreszrError(
                "Bug",
                "Multi-prototype specifier must provide an encode function."
            );
        }
        if (
            typeof this.fixedIndex !== "number" &&
            this.fixedIndex !== undefined
        ) {
            throw new PreszrError(
                "Bug",
                "Encoding fixed index must be a number or undefined."
            );
        }
    }

    validateVersion() {
        const { version, name } = this;
        if (typeof version !== "number" || !Number.isSafeInteger(version)) {
            throw new PreszrError(
                "Configuration",
                `Version for encoding ${name} must be an safe integer, and not ${version}.`
            );
        }
        if (version > MAX_VERSION || version < MIN_VERSION) {
            throw new PreszrError(
                "Configuration",
                `Version for encoding ${name} must be between ${MIN_VERSION} and ${MAX_VERSION}, and not ${version}`
            );
        }
    }
}

export class SpecialEncoding extends BaseEncoding {
    constructor(
        public readonly name: string,
        public readonly metadata?: any,
        public readonly fixedIndex?: number
    ) {
        super();
    }

    get key() {
        return `${this.name}.X`;
    }
}

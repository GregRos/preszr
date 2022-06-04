import {
    Encoding,
    EncodingSpecifier,
    fixedIndexProp,
    NonOverrideSpecifier,
    PrototypeEncoding,
    PrototypeSpecifier,
    SymbolEncoding
} from "../interface";
import { PreszrError } from "../errors";
import { getEncodingKey, mustParseEncodingKey } from "../encodings/utils";
import { getClassName, getProto, getSymbolName } from "../utils";
import { Fixed } from "../encodings/fixed";
import { nullPlaceholder } from "../encodings";
import { getPrototypeDecoder, getPrototypeEncoder } from "../encodings/objects";

const MAX_VERSION = 999;
const MIN_VERSION = 0;

export class EncodingStore {
    // We use multiple caches to speed up encoding and decoding.
    // It's a space/time trade-off, but it'll barely take any space.

    // This maintains a full list of all versions of all prototype encodings.
    // it's used for various checks and to built the caches.
    private _nameToProtoEncodings = new Map<
        string,
        Map<number, PrototypeEncoding>
    >();

    // This maintains all symbol encodings and is also used when encoding.
    private _symbolToEncoding = new Map<symbol, SymbolEncoding>();

    // Matches a prototype to an encoding. Used for some checks.
    private _protoToEncoding = new Map<object, PrototypeEncoding>();

    // A cache that quickly matches an encoding key, e.g. Custom/whatever.v5 -> encoding.
    // used when decoding.
    // Both symbol and proto encodings use this cache, but their keys are different.
    // Proto encodings have keys ending with .v${version}, and symbol encodings have keys
    // ending with .S
    private _keyToEncoding = new Map<string, Encoding>();

    // A "map" of index to built-in encoding. Has empty indexes.
    private _indexToEncoding = Array(Fixed.End) as Encoding[];

    // Quickly matches a prototype to an encoding. Weak map to avoid memory leaks.
    // Used and updated during operation, and needs to be rebuilt whenever encodings are added.
    // This will have the protos referenced by encodings, and also their descendants.
    // whenever the proto encoding list is updated, this becomes outdated.
    private _cacheProtoToEncoding:
        | WeakMap<object, PrototypeEncoding>
        | undefined;

    all(): Encoding[] {
        return [...this.getProtoEncodings(), ...this.getSymbolEncodings()];
    }

    private _getBuiltInEncoding(prototype: object) {
        const existing = this._protoToEncoding.get(prototype);
        if (!existing) {
            return null;
        }
        return this._isBuiltIn(existing) ? existing : null;
    }

    private _isBuiltIn(encoding: PrototypeEncoding) {
        const fixedIndex = encoding[fixedIndexProp];
        return fixedIndex != null && fixedIndex < Fixed.End;
    }

    private _registerProtos(encoding: PrototypeEncoding) {
        for (const proto of encoding.protos) {
            const existingEncoding = this._protoToEncoding.get(proto);
            // It's illegal to have two different encodings for the same prototype, since it becomes ambiguous.
            if (existingEncoding && existingEncoding.name !== encoding.name) {
                throw new PreszrError(
                    "Configuration",
                    `Encoding ${getEncodingKey(
                        encoding
                    )} references prototype ${getClassName(
                        proto
                    )}, but encoding ${getEncodingKey(
                        existingEncoding
                    )} also refers that prototype.`
                );
            }
            // However, it's okay to have the same encoding with different versions reference different prototypes.
            if (
                !existingEncoding ||
                existingEncoding.version < encoding.version
            ) {
                this._protoToEncoding.set(proto, encoding);
            }
        }
    }

    _mustHaveValidVersion(version: number, name?: string) {
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

    /**
     * @pure
     * @param encoding
     */
    _makeFromFullProto(encoding: PrototypeEncoding) {
        this._mustHaveValidVersion(encoding.version, encoding.name);
        if (!encoding.protos || encoding.protos.length === 0) {
            throw new PreszrError(
                "Configuration",
                "Full prototype encoding must specify one or more prototypes."
            );
        }
        encoding.protos.forEach(x => this._mustBeValidPrototype(x));
        if (!encoding.name) {
            throw new PreszrError(
                "Configuration",
                "Multi-prototype specifier must provide a name."
            );
        }
        if (!encoding.decoder) {
            throw new PreszrError(
                "Configuration",
                "Multi-prototype specifier must provide a decoder object."
            );
        }
        if (!encoding.encode) {
            throw new PreszrError(
                "Configuration",
                "Multi-prototype specifier must provide an encode function."
            );
        }
        return {
            decoder: encoding.decoder,
            protos: encoding.protos.slice(),
            name: encoding.name,
            encode: encoding.encode,
            version: encoding.version,
            [fixedIndexProp]: encoding[fixedIndexProp]
        };
    }

    _mustBeValidPrototype(proto: object) {
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

    _addFullEncoding(spec: EncodingSpecifier) {
        const fullEncoding = this._mustMakeEncoding(spec);
        // After adding encodings, the cache must be rebuilt.
        if ("symbol" in fullEncoding) {
            this._addSymbolEncoding(fullEncoding);
        } else if ("protos" in fullEncoding) {
            this._addProtoEncoding(fullEncoding);
        } else {
            throw new PreszrError("Configuration", "Unknown encoding format.");
        }
        return fullEncoding;
    }

    _maybeRegisterFixedIndexEncoding(encoding: Encoding) {
        const fixed = encoding[fixedIndexProp];
        if (fixed != null) {
            const existing = this._indexToEncoding[fixed];
            if (existing && existing.name !== encoding.name) {
                const enc1 = getEncodingKey(encoding);
                const enc2 = getEncodingKey(existing);
                throw new PreszrError(
                    "Configuration",
                    `Encodings '${enc1}' and '${enc2}' have identical fixed index (${fixed}).`
                );
            }
            this._indexToEncoding[fixed] = encoding;
        }
    }

    private _makeFromPartialSymbol(encoding: SymbolEncoding): SymbolEncoding {
        if (!encoding.symbol) {
            throw new PreszrError(
                "Configuration",
                "You must have a 'symbol' property in a symbol encoding."
            );
        }
        if (typeof encoding.symbol !== "symbol") {
            throw new PreszrError(
                "Configuration",
                `The 'symbol' property must be a symbol, and not a ${typeof encoding.symbol}.`
            );
        }
        const name = encoding.name ?? getSymbolName(encoding.symbol);
        if (!name) {
            throw new PreszrError(
                "Configuration",
                `Symbol has no description. Add a 'name' property.`
            );
        }
        const newEncoding: SymbolEncoding = {
            name,
            symbol: encoding.symbol
        };
        if (encoding[fixedIndexProp]) {
            newEncoding[fixedIndexProp] = encoding[fixedIndexProp];
        }
        return newEncoding;
    }

    private _makeFromCtor(ctor: Function) {
        return this._makeFromPartialProto({
            encodes: ctor
        });
    }

    _makeFromPartialProto(specifier: PrototypeSpecifier): PrototypeEncoding {
        if (specifier.encodes === undefined) {
            throw new PreszrError(
                "Configuration",
                "Encoding must specify a prototype."
            );
        }
        const proto =
            specifier.encodes === null
                ? nullPlaceholder
                : getProto(specifier.encodes);

        if (!proto) {
            throw new PreszrError(
                "Configuration",
                "Couldn't get prototype from constructor."
            );
        }

        const builtIn = this._getBuiltInEncoding(specifier.encodes);
        let name = specifier.name;
        if (builtIn) {
            if (name) {
                throw new PreszrError(
                    "Configuration",
                    `You can't specify a 'name' here, because the type ${getClassName(
                        specifier.encodes
                    )} is built-in.`
                );
            }
            name = builtIn.name;
        } else {
            name ??= getClassName(specifier.encodes);
            if (!name) {
                throw new PreszrError(
                    "Configuration",
                    "Couldn't get the name of the type being encoded. Add a 'name' property."
                );
            }
        }

        if (specifier.version != null) {
            this._mustHaveValidVersion(specifier.version, name);
        } else {
            specifier.version = 0;
        }

        return {
            protos: [proto],
            version: specifier.version,
            decoder: specifier.decoder ?? getPrototypeDecoder(proto),
            encode: specifier.encode ?? getPrototypeEncoder(proto),
            name: name
        };
    }

    _mustMakeEncoding(encoding: NonOverrideSpecifier): Encoding {
        if (typeof encoding === "function") {
            return this._makeFromCtor(encoding);
        } else if (typeof encoding === "symbol") {
            return this._makeFromSymbol(encoding);
        } else if (typeof encoding !== "object") {
            throw new PreszrError(
                "Configuration",
                `Expected encoding specifier to be an object, function, or symbol, but was: ${typeof encoding}.`
            );
        } else if ("protos" in encoding && encoding.protos) {
            return this._makeFromFullProto(encoding);
        } else if ("encodes" in encoding && encoding.encodes !== undefined) {
            return this._makeFromPartialProto(encoding);
        } else if ("symbol" in encoding && encoding.symbol) {
            return this._makeFromPartialSymbol(encoding);
        } else {
            throw new PreszrError(
                "Configuration",
                "Encoding specifier must have one of the properties: 'symbol', 'proto', or 'protos'."
            );
        }
    }

    _makeFromSymbol(symb: symbol) {
        const name = getSymbolName(symb);
        if (!name) {
            throw new PreszrError(
                "Configuration",
                `Symbol has no name. You must specify a full symbol encoding with a 'name' property.`
            );
        }
        return {
            name,
            symbol: symb
        };
    }

    add(...specs: EncodingSpecifier[]) {
        for (const spec of specs) {
            const encoding = this._addFullEncoding(spec);
            this._maybeRegisterFixedIndexEncoding(encoding);
        }
    }

    private _addProtoEncoding(encoding: PrototypeEncoding) {
        let versioned = this._nameToProtoEncodings.get(encoding.name);

        if (!versioned) {
            // Initialize the versioned encoding list if it doesn't exist
            versioned = new Map<number, PrototypeEncoding>();
            this._nameToProtoEncodings.set(encoding.name, versioned);
        }
        if (versioned.has(encoding.version)) {
            throw new PreszrError(
                "Configuration",
                `Encoding ${encoding.name} with version ${encoding.version} already exists in this instance.`
            );
        }
        this._registerProtos(encoding);
        // The latest encoding version is kept under -1 for easy access.
        const maxVersionEncoding = versioned.get(-1);
        if (
            !maxVersionEncoding ||
            maxVersionEncoding.version < encoding.version
        ) {
            versioned.set(-1, encoding);
            // If the max version was set, that means the proto cache is obsolete
            this._cacheProtoToEncoding = undefined;
        }
        versioned.set(encoding.version, encoding);
        this._keyToEncoding.set(getEncodingKey(encoding), encoding);
        return encoding;
    }

    *getProtoEncodings(): Generator<PrototypeEncoding> {
        for (const [proto, encoding] of this._protoToEncoding) {
            yield encoding;
        }
    }

    getSymbolEncodings(): Iterable<SymbolEncoding> {
        return this._symbolToEncoding.values();
    }

    private _addSymbolEncoding(encoding: SymbolEncoding) {
        const existingBySymbol = this._symbolToEncoding.get(encoding.symbol);
        const existingByKey = this._keyToEncoding.get(getEncodingKey(encoding));
        if (existingByKey) {
            throw new PreszrError(
                "Configuration",
                `Encoding with the name ${encoding.name} already exists in this instance.`
            );
        }
        if (existingBySymbol) {
            throw new PreszrError(
                "Configuration",
                `${encoding.name} references symbol ${getSymbolName(
                    encoding.symbol
                )}, but encoding ${
                    existingBySymbol.name
                } also references that symbol.`
            );
        }
        this._symbolToEncoding.set(encoding.symbol, encoding);
        this._keyToEncoding.set(getEncodingKey(encoding), encoding);
        return encoding;
    }

    mayGetBySymbol(s: symbol) {
        return this._symbolToEncoding.get(s);
    }

    mustGetByIndex(ix: number) {
        const encoding = this._indexToEncoding[ix];
        if (!encoding) {
            throw new PreszrError(
                "Decoding",
                `Encoding index ${ix} doesn't refer to any known encoding.`
            );
        }
        return encoding;
    }

    mustGetByKey(key: string) {
        const encoding = this._keyToEncoding.get(key);
        if (encoding) {
            return encoding;
        }

        // If it failed, this is going to be an error
        // which means there are no performance considerations. Let's gather as much
        // info as possible.
        const info = mustParseEncodingKey(key);
        if (info.type === "symbol") {
            throw new PreszrError(
                "Decoding",
                `No symbol encoding for name ${info.name}.`
            );
        } else {
            const namedProtoEncoding = this._nameToProtoEncodings
                .get(info.name)
                ?.get(-1);
            if (!namedProtoEncoding) {
                throw new PreszrError(
                    "Decoding",
                    `No prototype encoding named ${info.name}, for any version.`
                );
            }
            throw new PreszrError(
                "Decoding",
                `Prototype encoding ${info.name} doesn't exist for version ${info.version}. There is an encoding for ${namedProtoEncoding.version}`
            );
        }
    }

    private _makeWorkingProtoCache() {
        // We add an entry to the working encoding cache for every registered
        // encoding.
        const cache = new WeakMap<object, PrototypeEncoding>();
        for (const encoding of this.getProtoEncodings()) {
            if (!(encoding as any)) {
                throw new PreszrError(
                    "Bug",
                    `Expected there to be a maximum version encoding for ${encoding.name}.`
                );
            }
            for (const proto of encoding.protos) {
                cache.set(proto, encoding);
            }
        }
        return cache;
    }

    mustGetByProto(obj: object): PrototypeEncoding & { name: string } {
        if (!this._cacheProtoToEncoding) {
            this._cacheProtoToEncoding = this._makeWorkingProtoCache();
        }
        const fromCache = this._cacheProtoToEncoding.get(obj);
        if (fromCache) {
            return fromCache;
        }
        let foundEncoding: PrototypeEncoding;
        const chain = [] as object[];
        for (
            let proto = obj;
            ;
            proto = Object.getPrototypeOf(proto) ?? nullPlaceholder
        ) {
            const cached = this._cacheProtoToEncoding.get(proto);
            if (cached !== undefined) {
                foundEncoding = cached;
                break;
            }
            if (proto === nullPlaceholder) {
                throw new PreszrError(
                    "Bug",
                    "mustGetByProto failed to find anything."
                );
            }
            chain.push(proto);
        }
        for (const proto of chain) {
            this._cacheProtoToEncoding.set(proto, foundEncoding);
        }
        return foundEncoding;
    }
}

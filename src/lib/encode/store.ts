import {
    BaseEncoding,
    Encoding,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeSpecifier,
    SymbolEncoding
} from "../interface";
import { isSymbolSpecifier, mustParseEncodingKey } from "../encodings/utils";
import { getProto, getPrototypeName } from "../utils";
import { FixedIndexes } from "../encodings/fixed-indexes";
import { nullPlaceholder } from "../encodings";
import { UserEncoding } from "../encodings/user-encoding";
import { getErrorByCode } from "../errors/texts";

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
    private _indexToEncoding = Array(FixedIndexes.End) as Encoding[];

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
        const fixedIndex = encoding.fixedIndex;
        return fixedIndex != null && fixedIndex < FixedIndexes.End;
    }

    private _registerProtos(encoding: PrototypeEncoding) {
        const existingEncoding = this._protoToEncoding.get(encoding.encodes);
        // It's illegal to have two different encodings for the same prototype, since it becomes ambiguous.
        if (existingEncoding && existingEncoding.name !== encoding.name) {
            throw getErrorByCode("config/proto/proto-collision")(
                existingEncoding,
                encoding
            );
        }
        // However, it's okay to have the same encoding with different versions reference different prototypes.
        if (!existingEncoding || existingEncoding.version < encoding.version) {
            this._protoToEncoding.set(encoding.encodes, encoding);
        }
    }

    _addEncoding(encoding: Encoding) {
        // After adding encodings, the cache must be rebuilt.
        if (encoding instanceof SymbolEncoding) {
            this._addSymbolEncoding(encoding);
        } else if (encoding instanceof PrototypeEncoding) {
            this._addProtoEncoding(encoding);
        } else {
            throw getErrorByCode("bug/config/unknown-encoding")(encoding);
        }
    }

    _maybeRegisterFixedIndexEncoding(encoding: Encoding) {
        const fixed = encoding.fixedIndex;
        if (fixed != null) {
            const existing = this._indexToEncoding[fixed];
            if (existing && existing.name !== encoding.name) {
                throw getErrorByCode("bug/config/fixed-index-collision")(
                    encoding,
                    existing
                );
            }
            this._indexToEncoding[fixed] = encoding;
        }
    }

    makeEncodingFromCtor(ctor: Function) {
        return this.makeEncodingFromProtoSpec({
            encodes: ctor
        });
    }

    makeEncodingFromProtoSpec(
        specifier: PrototypeSpecifier
    ): PrototypeEncoding {
        let proto: object;
        if (typeof specifier.encodes === "function") {
            proto = getProto(specifier.encodes);
            if (!proto) {
                throw getErrorByCode("config/proto/couldnt-get-prototype")(
                    specifier.encodes
                );
            }
        } else if (typeof specifier.encodes === "object") {
            proto = specifier.encodes;
        } else {
            throw getErrorByCode("config/spec/bad-encodes")(specifier.encodes);
        }
        const builtIn = this._getBuiltInEncoding(proto);
        let name = specifier.name;
        let fixedIndex: number | undefined = undefined;
        if (builtIn) {
            if (name) {
                throw getErrorByCode("config/spec/name-illegal-builtin")(proto);
            }
            name = builtIn.name;
            fixedIndex = builtIn.fixedIndex;
        } else {
            name ??= getPrototypeName(proto);
            if (!name) {
                throw getErrorByCode("config/spec/proto/no-name")(proto);
            }
        }

        const encoding = new UserEncoding(
            {
                encodes: proto,
                encode: specifier.encode,
                version: specifier.version,
                name,
                decoder: specifier.decoder
            },
            fixedIndex
        );
        return encoding;
    }

    makeEncoding(encoding: EncodingSpecifier): Encoding {
        if (typeof encoding === "function") {
            return this.makeEncodingFromCtor(encoding);
        }
        if (typeof encoding === "symbol") {
            return SymbolEncoding.fromSymbol(encoding);
        }
        if (typeof encoding !== "object") {
            throw getErrorByCode("config/spec/bad-type")(encoding);
        }
        if (!encoding.encodes) {
            throw getErrorByCode("config/spec/no-encodes")();
        }
        if (isSymbolSpecifier(encoding)) {
            return SymbolEncoding.fromSpecifier(encoding);
        }

        return this.makeEncodingFromProtoSpec(encoding);
    }

    add(...encodings: (Encoding | EncodingSpecifier)[]) {
        for (const encoding of encodings) {
            const fullEncoding =
                encoding instanceof BaseEncoding
                    ? encoding
                    : this.makeEncoding(encoding);
            this._addEncoding(fullEncoding);
        }
    }

    private _addProtoEncoding(encoding: PrototypeEncoding) {
        const existingByProto = this._protoToEncoding.get(encoding.encodes);
        if (existingByProto) {
            encoding.mustBeCompatible(existingByProto);
        }

        let versioned = this._nameToProtoEncodings.get(encoding.name);
        if (!versioned) {
            // Initialize the versioned encoding list if it doesn't exist
            versioned = new Map<number, PrototypeEncoding>();
            this._nameToProtoEncodings.set(encoding.name, versioned);
        }
        if (versioned.get(encoding.version)) {
            throw getErrorByCode("config/proto/encoding-exists")(encoding);
        }
        versioned.set(encoding.version, encoding);
        this._registerProtos(encoding);
        // The latest encoding version is kept under -1 for easy access.
        const maxVersionEncoding = versioned.get(-1);
        if (
            !maxVersionEncoding ||
            maxVersionEncoding.version < encoding.version
        ) {
            versioned.set(-1, encoding);
            this._maybeRegisterFixedIndexEncoding(encoding);
            // If the max version was set, that means the proto cache is obsolete
            this._cacheProtoToEncoding = undefined;
        }
        versioned.set(encoding.version, encoding);
        this._keyToEncoding.set(encoding.key, encoding);
        return encoding;
    }

    *getProtoEncodings(): Generator<PrototypeEncoding> {
        for (const [, encoding] of this._protoToEncoding) {
            yield encoding;
        }
    }

    getSymbolEncodings(): Iterable<SymbolEncoding> {
        return this._symbolToEncoding.values();
    }

    private _addSymbolEncoding(encoding: SymbolEncoding) {
        const existingBySymbol = this._symbolToEncoding.get(encoding.encodes);
        const existingByKey = this._keyToEncoding.get(
            encoding.key
        ) as SymbolEncoding;
        if (existingByKey) {
            throw getErrorByCode("config/symbol/name-exists")(existingByKey);
        }
        if (existingBySymbol) {
            throw getErrorByCode("config/symbol/already-encoded")(
                existingBySymbol,
                encoding
            );
        }
        this._symbolToEncoding.set(encoding.encodes, encoding);
        this._keyToEncoding.set(encoding.key, encoding);
        this._maybeRegisterFixedIndexEncoding(encoding);
        return encoding;
    }

    mayGetBySymbol(s: symbol) {
        return this._symbolToEncoding.get(s);
    }

    mustGetByIndex(ix: number) {
        const encoding = this._indexToEncoding[ix];
        if (!encoding) {
            if (ix < FixedIndexes.End) {
                throw getErrorByCode("decode/map/unknown-builtin-index")(ix);
            }
            throw getErrorByCode("decode/map/unknown-index")(ix);
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
            throw getErrorByCode("decode/keys/unknown-symbol")(info.name);
        } else {
            const namedProtoEncoding = this._nameToProtoEncodings
                .get(info.name)
                ?.get(-1);

            if (!namedProtoEncoding) {
                throw getErrorByCode("decode/keys/unknown-proto")(info.name);
            }
            throw getErrorByCode("decode/keys/unknown-proto-version")(
                info.name,
                info.version,
                namedProtoEncoding
            );
        }
    }

    private _makeWorkingProtoCache() {
        // We add an entry to the working encoding cache for every registered
        // encoding.
        const cache = new WeakMap<object, PrototypeEncoding>();
        for (const encoding of this.getProtoEncodings()) {
            if (!(encoding as any)) {
                getErrorByCode("bug/encode/no-highest-version")(encoding);
            }
            cache.set(encoding.encodes, encoding);
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
                throw getErrorByCode("bug/encode/proto-without-match")(
                    chain[0]
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

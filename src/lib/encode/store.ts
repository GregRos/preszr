import { nullPlaceholder } from "../encodings"
import { FixedIndexes } from "../encodings/fixed-indexes"
import { UserEncoding } from "../encodings/user-encoding"
import { isSymbolSpecifier, mustParseEncodingKey } from "../encodings/utils"
import {
    bug_fixedIndexCollision,
    config_encoding_bad,
    config_encoding_failedToInfer,
    config_encoding_fullCollision,
    config_encoding_targetCollision,
    config_nameIllegalBuiltIn,
    decode_unknownEncoding,
    decode_unknownEncodingVersion,
    warn_encode_unknown_prototype
} from "../errors/texts2"
import {
    BaseEncoding,
    Encoding,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeSpecifier,
    SymbolEncoding
} from "../interface"
import { getProtoName } from "../utils"

export class EncodingStore {
    // We use multiple caches to speed up encoding and decoding.
    // It's a space/time trade-off, but it'll barely take any space.

    // This maintains a full list of all versions of all prototype encodings.
    // it's used for various checks and to built the caches.
    private _nameToProtoEncodings = new Map<string, Map<number, PrototypeEncoding>>()

    // This maintains all symbol encodings and is also used when encoding.
    private _symbolToEncoding = new Map<symbol, SymbolEncoding>()

    // Matches a prototype to an encoding. Used for some checks.
    private _protoToEncoding = new Map<object, PrototypeEncoding>()

    // A cache that quickly matches an encoding key, e.g. Custom/whatever.v5 -> encoding.
    // used when decoding.
    // Both symbol and proto encodings use this cache, but their keys are different.
    // Proto encodings have keys ending with .v${version}, and symbol encodings have keys
    // ending with .S
    private _keyToEncoding = new Map<string, Encoding>()

    // A "map" of index to built-in encoding. Has empty indexes.
    private _indexToEncoding = Array(FixedIndexes.End) as Encoding[]

    // Quickly matches a prototype to an encoding. Weak map to avoid memory leaks.
    // Used and updated during operation, and needs to be rebuilt whenever encodings are added.
    // This will have the protos referenced by encodings, and also their descendants.
    // whenever the proto encoding list is updated, this becomes outdated.
    private _cacheProtoToEncoding: WeakMap<object, PrototypeEncoding> | undefined

    all(): Encoding[] {
        return [...this.getProtoEncodings(), ...this.getSymbolEncodings()]
    }

    private _getBuiltInEncoding(prototype: object) {
        const existing = this._protoToEncoding.get(prototype)
        if (!existing) {
            return null
        }
        return this._isBuiltIn(existing) ? existing : null
    }

    private _isBuiltIn(encoding: PrototypeEncoding) {
        const fixedIndex = encoding.fixedIndex
        return fixedIndex != null && fixedIndex < FixedIndexes.End
    }

    private _registerProtos(encoding: PrototypeEncoding) {
        const existingEncoding = this._protoToEncoding.get(encoding.encodes)
        // It's illegal to have two different encodings for the same prototype, since it becomes ambiguous.
        if (existingEncoding && existingEncoding.name !== encoding.name) {
            throw config_encoding_targetCollision(existingEncoding, encoding)
        }
        // However, it's okay to have the same encoding with different versions reference different prototypes.
        if (!existingEncoding || existingEncoding.version < encoding.version) {
            this._protoToEncoding.set(encoding.encodes, encoding)
        }
    }

    _addEncoding(encoding: Encoding) {
        // After adding encodings, the cache must be rebuilt.
        if (encoding instanceof SymbolEncoding) {
            this._addSymbolEncoding(encoding)
        } else if (encoding instanceof PrototypeEncoding) {
            this._addProtoEncoding(encoding)
        } else {
            throw new Error("Internal error – unknown encoding type.")
        }
    }

    _maybeRegisterFixedIndexEncoding(encoding: Encoding) {
        const fixed = encoding.fixedIndex
        if (fixed != null) {
            const existing = this._indexToEncoding[fixed]
            if (existing && existing.name !== encoding.name) {
                throw bug_fixedIndexCollision(encoding, existing)
            }
            this._indexToEncoding[fixed] = encoding
        }
    }

    makeEncodingFromCtor(ctor: Function) {
        if (!ctor.prototype) {
            throw config_encoding_failedToInfer(ctor)
        }
        return this.makeEncodingFromProtoSpec({
            encodes: ctor.prototype
        })
    }

    makeEncodingFromProtoSpec<T extends object>(
        specifier: PrototypeSpecifier<T>
    ): PrototypeEncoding {
        const proto = specifier.encodes
        const builtIn = this._getBuiltInEncoding(proto as object)
        let name = specifier.name
        let fixedIndex: number | undefined = undefined
        if (builtIn) {
            if (name) {
                throw config_nameIllegalBuiltIn(builtIn)
            }
            name = builtIn.name
            fixedIndex = builtIn.fixedIndex
        } else {
            name ??= getProtoName(proto)
            if (!name) {
                throw config_encoding_failedToInfer(proto)
            }
        }

        const encoding = new UserEncoding<T>(
            {
                encodes: proto,
                encode: specifier.encode,
                version: specifier.version,
                name,
                decoder: specifier.decoder
            },
            fixedIndex
        )
        return encoding
    }

    makeEncoding(encoding: EncodingSpecifier): Encoding {
        if (typeof encoding === "function") {
            return this.makeEncodingFromCtor(encoding)
        }
        if (typeof encoding === "symbol") {
            return SymbolEncoding.fromSymbol(encoding)
        }
        if (typeof encoding !== "object") {
            throw config_encoding_bad(encoding as any)
        }
        if (!encoding.encodes) {
            throw config_encoding_bad(encoding)
        }
        if (isSymbolSpecifier(encoding)) {
            return SymbolEncoding.fromSpecifier(encoding)
        }

        return this.makeEncodingFromProtoSpec(encoding)
    }

    add(...encodings: (Encoding | EncodingSpecifier)[]) {
        for (const encoding of encodings) {
            const fullEncoding =
                encoding instanceof BaseEncoding ? encoding : this.makeEncoding(encoding)
            this._addEncoding(fullEncoding as Encoding)
        }
    }

    private _addProtoEncoding(encoding: PrototypeEncoding) {
        const existingByProto = this._protoToEncoding.get(encoding.encodes)
        if (existingByProto) {
            encoding.mustBeCompatible(existingByProto)
        }

        let versioned = this._nameToProtoEncodings.get(encoding.name)
        if (!versioned) {
            // Initialize the versioned encoding list if it doesn't exist
            versioned = new Map<number, PrototypeEncoding>()
            this._nameToProtoEncodings.set(encoding.name, versioned)
        }
        const existing = versioned.get(encoding.version)
        if (existing) {
            throw config_encoding_fullCollision(existing, encoding)
        }
        versioned.set(encoding.version, encoding)
        this._registerProtos(encoding)
        // The latest encoding version is kept under -1 for easy access.
        const maxVersionEncoding = versioned.get(-1)
        if (!maxVersionEncoding || maxVersionEncoding.version < encoding.version) {
            versioned.set(-1, encoding)
            this._maybeRegisterFixedIndexEncoding(encoding)
            // If the max version was set, that means the proto cache is obsolete
            this._cacheProtoToEncoding = undefined
        }
        versioned.set(encoding.version, encoding)
        this._keyToEncoding.set(encoding.key, encoding)
        return encoding
    }

    *getProtoEncodings(): Generator<PrototypeEncoding> {
        for (const [, encoding] of this._protoToEncoding) {
            yield encoding
        }
    }

    getSymbolEncodings(): Iterable<SymbolEncoding> {
        return this._symbolToEncoding.values()
    }

    private _addSymbolEncoding(encoding: SymbolEncoding) {
        const existingBySymbol = this._symbolToEncoding.get(encoding.encodes)
        const existingByKey = this._keyToEncoding.get(encoding.key) as SymbolEncoding

        if (existingBySymbol) {
            throw config_encoding_targetCollision(existingBySymbol, encoding)
        }
        if (existingByKey) {
            throw config_encoding_fullCollision(existingByKey, encoding)
        }
        this._symbolToEncoding.set(encoding.encodes, encoding)
        this._keyToEncoding.set(encoding.key, encoding)
        this._maybeRegisterFixedIndexEncoding(encoding)
        return encoding
    }

    mayGetBySymbol(s: symbol) {
        return this._symbolToEncoding.get(s)
    }

    mustGetByIndex(ix: number) {
        const encoding = this._indexToEncoding[ix]
        return encoding
    }

    mustGetByKey(key: string) {
        const encoding = this._keyToEncoding.get(key)
        if (encoding) {
            return encoding
        }

        // If it failed, this is going to be an error
        // which means there are no performance considerations. Let's gather as much
        // info as possible.
        const info = mustParseEncodingKey(key)
        if (info.type === "symbol") {
            throw decode_unknownEncoding("symbol", info.name)
        } else {
            const namedProtoEncoding = this._nameToProtoEncodings.get(info.name)?.get(-1)
            if (!namedProtoEncoding) {
                throw decode_unknownEncoding("prototype", info.name)
            }
            throw decode_unknownEncodingVersion(info.name, info.version)
        }
    }

    private _makeWorkingProtoCache() {
        // We add an entry to the working encoding cache for every registered
        // encoding.
        const cache = new WeakMap<object, PrototypeEncoding>()
        for (const encoding of this.getProtoEncodings()) {
            cache.set(encoding.encodes, encoding)
        }
        return cache
    }

    _warnedForPrototypes = new WeakSet<object>()

    mustGetByProto(obj: object): PrototypeEncoding & { name: string } {
        if (!this._cacheProtoToEncoding) {
            this._cacheProtoToEncoding = this._makeWorkingProtoCache()
        }
        const fromCache = this._cacheProtoToEncoding.get(obj)
        if (fromCache) {
            return fromCache
        }
        let foundEncoding: PrototypeEncoding
        const chain = [] as object[]
        for (let proto = obj; ; proto = Object.getPrototypeOf(proto) ?? nullPlaceholder) {
            const cached = this._cacheProtoToEncoding.get(proto)
            if (cached !== undefined) {
                foundEncoding = cached
                break
            }
            if (proto === nullPlaceholder) {
                throw new Error("proto no match")
            }
            chain.push(proto)
        }
        for (const proto of chain.slice(0, 2)) {
            this._cacheProtoToEncoding.set(proto, foundEncoding)
        }
        if (chain.length > 1 && chain[1] && !this._warnedForPrototypes.has(chain[1])) {
            this._warnedForPrototypes.add(chain[1])
            console.warn(warn_encode_unknown_prototype(chain[1], foundEncoding))
        }
        return foundEncoding
    }
}

import {
    Encoding,
    EncodingSpecifier,
    fixedIndexProp,
    PrototypeEncoding,
    SymbolEncoding
} from "../interface";
import { PreszrError } from "../errors";
import { getEncodingKey, makeFullEncoding, mustParseEncodingKey } from "../encodings/utils";
import { getClassName, getSymbolName } from "../utils";
import { Fixed } from "../encodings/fixed";
import { nullPlaceholder } from "../encodings";

export function expandInsert<T>(arr: (T | undefined)[], index: number, item: T) {
    // We want a number of empty spaces so that the array's new length is
    // index + 1. therefore we want index - arr.Length spaces.

    // We do it this way to avoid actual holes in the array, which makes JS
    // engines encode the array in unoptimized ways.

    // we'll make an extra space for the place to insert the item.
    const spaces = index - arr.length + 1;
    for (let i = 0; i < spaces; i++) {
        arr.push(undefined);
    }
    arr[index] = item;
}

export class EncodingStore {
    // We use multiple caches to speed up encoding and decoding.
    // It's a space/time trade-off, but it'll barely take any space.

    // This maintains a full list of all versions of all prototype encodings.
    // it's used for various checks and to built the caches.
    private _nameToProtoEncodings = new Map<string, Map<number, PrototypeEncoding>>();

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
    private _indexToEncoding = Array(Fixed.End);

    // Quickly matches a prototype to an encoding. Weak map to avoid memory leaks.
    // Used and updated during operation, and needs to be rebuilt whenever encodings are added.
    // This will have the protos referenced by encodings, and also their descendants.
    // whenever the proto encoding list is updated, this becomes outdated.
    private _cacheProtoToEncoding: WeakMap<object, PrototypeEncoding> | undefined;

    all(): Encoding[] {
        return [...this.getProtoEncodings(), ...this.getSymbolEncodings()];
    }

    private _registerProtos(encoding: PrototypeEncoding) {
        for (const proto of encoding.prototypes) {
            const existingEncoding = this._protoToEncoding.get(proto);
            // It's illegal to have two different encodings for the same prototype, since it becomes ambiguous.
            if (existingEncoding && existingEncoding.name !== encoding.name) {
                throw new PreszrError(
                    `Prototype collision - ${getEncodingKey(
                        encoding
                    )} references prototype ${getClassName(proto)}, but encoding ${getEncodingKey(
                        existingEncoding
                    )} also refers that prototype.`
                );
            }
            // However, it's okay to have the same encoding with different versions reference different prototypes.
            if (!existingEncoding || existingEncoding.version < encoding.version) {
                this._protoToEncoding.set(proto, encoding);
            }
        }
    }

    add(...specs: EncodingSpecifier[]) {
        for (const spec of specs) {
            const encoding = makeFullEncoding(spec);
            // After adding encodings, the cache must be rebuilt.
            if ("symbol" in encoding) {
                this._addSymbolEncoding(encoding);
            } else {
                this._addProtoEncoding(encoding);
            }
            const fixed = encoding[fixedIndexProp];
            if (fixed != null) {
                const existing = this._indexToEncoding[fixed];
                if (existing) {
                    const enc1 = getEncodingKey(encoding);
                    const enc2 = getEncodingKey(existing);
                    throw new PreszrError(
                        `Configuration - Encodings '${enc1}' and '${enc2}' have identical fixed index (${fixed}).`
                    );
                }
                this._indexToEncoding[fixed] = encoding;
            }
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
                `Version collision - encoding ${encoding.name} with version ${encoding.version} already exists in this instance.`
            );
        }
        this._registerProtos(encoding);
        // The latest encoding version is kept under -1 for easy access.
        const maxVersionEncoding = versioned.get(-1);
        if (!maxVersionEncoding || maxVersionEncoding.version < encoding.version) {
            versioned.set(-1, encoding);
            // If the max version was set, that means the proto cache is obsolete
            this._cacheProtoToEncoding = undefined;
        }
        versioned.set(encoding.version, encoding);
        this._keyToEncoding.set(getEncodingKey(encoding), encoding);
    }

    *getProtoEncodings(): Generator<PrototypeEncoding> {
        for (const [name, versions] of this._nameToProtoEncodings) {
            // get latest version encoding
            const maxVersionEncoding = versions.get(-1);
            if (!maxVersionEncoding) {
                throw new Error(
                    `Invariant failed - expected there to be a maximum version encoding for ${name}.`
                );
            }
            yield maxVersionEncoding;
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
                `Configuration - encoding with the name ${encoding.name} already exists in this instance.`
            );
        }
        if (existingBySymbol) {
            throw new PreszrError(
                `Configuration - ${encoding.name} references symbol ${getSymbolName(
                    encoding.symbol
                )}, but encoding ${existingBySymbol.name} also references that symbol.`
            );
        }
        this._symbolToEncoding.set(encoding.symbol, encoding);
        this._keyToEncoding.set(getEncodingKey(encoding), encoding);
    }

    mayGetBySymbol(s: symbol) {
        return this._symbolToEncoding.get(s);
    }

    mustGetByIndex(ix: number) {
        const encoding = this._indexToEncoding[ix];
        if (!encoding) {
            throw new PreszrError(
                `Missing Encoding - Index ${ix} doesn't refer to any known encoding.`
            );
        }
        return encoding;
    }

    mustGetByKey(key: string) {
        const encoding = this._keyToEncoding.get(key);
        if (encoding) {
            return encoding;
        }

        // The above was the happy path. If it failed, this is going to be an error
        // which means there are no performance considerations. Let's gather as much
        // info as possible.
        const info = mustParseEncodingKey(key);
        if (info.type === "symbol") {
            throw new PreszrError(`Decoding - no symbol encoding for name ${info.name}.`);
        } else {
            const namedProtoEncoding = this._nameToProtoEncodings.get(info.name)?.get(-1);
            if (!namedProtoEncoding) {
                throw new PreszrError(
                    `Missing encoding - no prototype encoding named ${info.name}, for any version.`
                );
            }
            throw new PreszrError(
                `Missing encoding - prototype encoding ${info.name} exists, but not for version ${info.version}, such as for ${namedProtoEncoding.version}`
            );
        }
    }

    private _makeWorkingProtoCache() {
        // We add an entry to the working encoding cache for every registered
        // encoding.
        const cache = new WeakMap<object, PrototypeEncoding>();
        for (const encoding of this.getProtoEncodings()) {
            if (!(encoding as any)) {
                throw new Error(
                    `Invariant failed - expected there to be a maximum version encoding for ${encoding.name}.`
                );
            }
            for (const proto of encoding.prototypes) {
                cache.set(proto, encoding);
            }
        }
        return cache;
    }

    mustGetByProto(obj: object) {
        if (!this._cacheProtoToEncoding) {
            this._cacheProtoToEncoding = this._makeWorkingProtoCache();
        }
        const fromCache = this._cacheProtoToEncoding.get(obj);
        if (fromCache) {
            return fromCache;
        }
        let foundEncoding: PrototypeEncoding;
        const chain = [] as object[];
        for (let proto = obj; ; proto = Object.getPrototypeOf(proto) ?? nullPlaceholder) {
            const cached = this._cacheProtoToEncoding.get(proto);
            if (cached !== undefined) {
                foundEncoding = cached;
                break;
            }
            if (proto === nullPlaceholder) {
                throw new PreszrError("Invariant failed - mustGetByProto failed to find anything.");
            }
            chain.push(proto);
        }
        for (const proto of chain) {
            this._cacheProtoToEncoding.set(proto, foundEncoding);
        }
        return foundEncoding;
    }
}

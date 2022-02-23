import { Encoding, EncodingSpecifier, PrototypeEncoding, SymbolEncoding } from "../interface";
import { PreszrError } from "../errors";
import { getEncodingKey, makeFullEncoding, mustParseEncodingKey } from "./utils";
import { getClassName, getSymbolName } from "../utils";
import { WorkingEncodingCache } from "./cache";

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

    getWorkingCopy() {
        return new WorkingEncodingCache(this);
    }

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
                this.addSymbolEncoding(encoding);
            } else {
                this.addProtoEncoding(encoding);
            }
        }
    }

    addProtoEncoding(encoding: PrototypeEncoding) {
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
        }
        versioned.set(encoding.version, encoding);
        // We delete the cache as it's now out of date - some prototypes
        // might be linked to different encodings.
        this._cacheProtoToEncoding = undefined;
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

    addSymbolEncoding(encoding: SymbolEncoding) {
        const existingBySymbol = this._symbolToEncoding.get(encoding.symbol);
        const existingByKey = this._keyToEncoding.get(encoding.name);
        if (existingByKey) {
            throw new PreszrError(
                `Name collision - encoding with the name ${encoding.name} already exists in this instance.`
            );
        }
        if (existingBySymbol) {
            throw new PreszrError(
                `Symbol collision - ${encoding.name} references symbol ${getSymbolName(
                    encoding.symbol
                )}, but encoding ${existingBySymbol.name} also references that symbol.`
            );
        }
        this._symbolToEncoding.set(encoding.symbol, encoding);
        this._keyToEncoding.set(encoding.name, encoding);
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
            throw new PreszrError(`Missing encoding - no symbol encoding for name ${info.name}.`);
        } else {
            const namedProtoEncoding = this._nameToProtoEncodings.get(info.name)?.get(-1);
            if (!namedProtoEncoding) {
                throw new PreszrError(
                    `Missing encoding - no prototype encoding named ${info.name}, for any version.`
                );
            }
            throw new PreszrError(
                `Missing encoding - prototype encoding ${info.name} exists, but not for version ${info.version}.`
            );
        }
    }
}

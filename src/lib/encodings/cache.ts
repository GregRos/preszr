import { Encoding, EncodingSpecifier, PrototypeEncoding, SymbolEncoding } from "../interface";
import { PreszrError } from "../errors";
import { getEncodingKey, makeFullEncoding, mustParseEncodingKey } from "./utils";
import { getClassName, getSymbolName } from "../utils";

export class EncodingCache {
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
    private _cacheKeyToEncoding = new Map<string, Encoding>();

    // Quickly matches a prototype to an encoding. Weak map to avoid memory leaks.
    // Used and updated during operation, and needs to be rebuilt whenever encodings are added.
    // This will have the protos referenced by encodings, and also their descendants.
    private _cacheProtoToEncoding = new WeakMap<object, Encoding>();

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
        }
        versioned.set(encoding.version, encoding);
        // We register the encoding to the key-based cache for decoding later
        this._cacheKeyToEncoding.set(getEncodingKey(encoding), encoding);
    }

    private _addSymbolEncoding(encoding: SymbolEncoding) {
        const existingBySymbol = this._symbolToEncoding.get(encoding.symbol);
        if (existingBySymbol) {
            throw new PreszrError(
                `Symbol collision - ${encoding.name} references symbol ${getSymbolName(
                    encoding.symbol
                )}, but encoding ${existingBySymbol.name} also references that prototype.`
            );
        }
        const existingByKey = this._cacheKeyToEncoding.get(encoding.name);
        if (existingByKey) {
            throw new PreszrError(
                `Name collision - encoding with the name ${encoding.name} already exists in this instance.`
            );
        }
        this._symbolToEncoding.set(encoding.symbol, encoding);
        this._cacheKeyToEncoding.set(encoding.name, encoding);
    }

    add(spec: EncodingSpecifier) {
        const encoding = makeFullEncoding(spec);
        if ("symbol" in encoding) {
            this._addSymbolEncoding(encoding);
        } else {
            this._addProtoEncoding(encoding);
        }
    }

    mustGetByKey(key: string) {
        const encoding = this._cacheKeyToEncoding.get(key);
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

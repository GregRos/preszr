import {
    EncodeContext,
    Encoding,
    PrototypeEncoding,
    SymbolEncoding
} from "../interface";
import { version } from "../utils";
import {
    Entity,
    noResultPlaceholder,
    PreszrFormat,
    Reference,
    tryEncodeScalar
} from "../data";
import { FixedIndexes } from "../encodings/fixed-indexes";
import { EncodingStore } from "./store";
import { getUnrecSymbolEncoding } from "../encodings/unrec-symbol";
import { encode_require_cycle } from "../errors/texts2";

const TypedArray = Object.getPrototypeOf(Uint8Array.prototype)
    .constructor as any;

export class EncodeCtx implements EncodeContext {
    private _encodingKeys = new Map<Encoding, number>();
    private _objectToRef = new Map<object | symbol | string, Reference>();
    private _encodingSpec = Object.create(null);
    private _metadata = Object.create(null);
    private _entityStream = [0] as unknown as PreszrFormat;
    private _requirementsStack = new Set<object>();
    self!: PrototypeEncoding;
    _isImplicit = false;
    metadata = undefined;

    constructor(private _store: EncodingStore) {}

    private _getEncodingIndexAndRegister(encoding: Encoding) {
        if (encoding.fixedIndex != null) {
            return encoding.fixedIndex;
        }
        const encodingKeys = this._encodingKeys;
        let encodingIndex = encodingKeys.get(encoding);
        if (encodingIndex == null) {
            encodingIndex = encodingKeys.size + FixedIndexes.End;
            encodingKeys.set(encoding, encodingIndex);
        }
        return encodingIndex;
    }

    private _mustGetBySymbol(s: symbol): SymbolEncoding {
        const inner = this._store.mayGetBySymbol(s);
        if (!inner) {
            return getUnrecSymbolEncoding(s);
        }
        return inner;
    }

    private _initNextCell(real: any, representation: any): Reference {
        const ref = `${this._entityStream.length}`;

        this._entityStream.push(representation);
        this._objectToRef.set(real, ref);
        return ref;
    }

    require(value: Entity): void {
        if (typeof value === "object" || value !== null) {
            this.encode(value);
        }
    }

    private _createNewRef(value: Entity): Reference {
        const { _entityStream: msg, _encodingSpec, _metadata, _store } = this;
        if (typeof value === "string") {
            return this._initNextCell(value, value);
        }
        if (typeof value === "symbol") {
            const index = msg.length;
            const encoding = this._mustGetBySymbol(value);
            this._encodingSpec[index] =
                this._getEncodingIndexAndRegister(encoding);
            if ("metadata" in encoding && encoding.metadata) {
                this._metadata[index] = encoding.metadata;
            }
            return this._initNextCell(value, 0);
        }

        if (this._requirementsStack.has(value)) {
            throw encode_require_cycle(value);
        }

        const encoding = _store.mustGetByProto(value);
        const oldMetadata = this.metadata;
        this.self = encoding;
        if (encoding.encoder.requirements) {
            try {
                this._requirementsStack.add(value);
                encoding.encoder.requirements(value, this);
            } finally {
                this._requirementsStack.delete(value);
            }
        }

        // Now that the object's REQUIREMENTS stage is finished, we can create a cell for it.
        const ref = this._initNextCell(value, 0);

        const preszed = encoding.encoder.encode(value, this);
        this.self = null!;
        // _isImplicit will be set only on specific library encodings.
        // For example `object`. This is to make sure regular objects don't get the extra
        // characters needed to mark their encodings.
        if (!this._isImplicit) {
            _encodingSpec[ref] = this._getEncodingIndexAndRegister(encoding);
        }

        this._isImplicit = false;
        if (this.metadata !== undefined) {
            _metadata[ref] = this.metadata;
        }
        this.metadata = oldMetadata;
        msg[+ref] = preszed;
        return ref;
    }

    private _makeEncodingKeys() {
        const encodingKeys = [];
        // We're just using the fact Maps are sorted by insertion order
        for (const encoding of this._encodingKeys.keys()) {
            encodingKeys.push(encoding.key);
        }
        return encodingKeys;
    }

    encode(value: any) {
        const tryScalar = tryEncodeScalar(value);
        if (tryScalar !== noResultPlaceholder) {
            return tryScalar;
        }
        let foundRef = this._objectToRef.get(value);
        if (!foundRef) {
            foundRef = this._createNewRef(value);
        }
        return foundRef;
    }

    finish(selected: string) {
        // This returns a message we have so far.
        const wm = this._entityStream;
        wm[0] = [
            version,
            this._makeEncodingKeys(),
            this._encodingSpec,
            this._metadata,
            +selected
        ];
        return wm;
    }
}

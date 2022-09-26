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

const TypedArray = Object.getPrototypeOf(Uint8Array.prototype)
    .constructor as any;
export class EncodeCtx implements EncodeContext {
    private _encodingKeys = new Map<Encoding, number>();
    private _objectToRef = new Map<object | symbol | string, Reference>();
    private _encodingSpec = Object.create(null);
    private _metadata = Object.create(null);
    private _workingMessage = [0] as unknown as PreszrFormat;
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

    private _createNewRef(value: Entity): Reference {
        const {
            _workingMessage: msg,
            _objectToRef,
            _encodingSpec,
            _metadata,
            _store
        } = this;
        if (value instanceof TypedArray) {
            // Due to how shared-buffer typed arrays work, they can't be encoded using the standard method.
            // While there are some generic ways this can be done, they make the message format much more complex
            // and introduce tons of issues.

            // An alternative is to add a hardcoded special case.
            const buffer = (value as Uint8Array).buffer;
            // This will add the TypedArray to the
            this.encode(buffer);
        }
        const index = msg.length;
        const ref = `${index}`;
        _objectToRef.set(value, ref);
        if (typeof value === "string") {
            msg.push(value);
            return ref;
        }

        msg.push(0);
        if (typeof value === "symbol") {
            const encoding = this._mustGetBySymbol(value);
            this._encodingSpec[index] =
                this._getEncodingIndexAndRegister(encoding);
            if ("metadata" in encoding && encoding.metadata) {
                this._metadata[index] = encoding.metadata;
            }
            return ref;
        }
        const encoding = _store.mustGetByProto(value);
        const oldMetadata = this.metadata;
        this.self = encoding;
        const preszed = encoding.encode(value, this);
        this.self = null!;
        // _isImplicit will be set only on specific library encodings.
        // For example `object`. This is to make sure regular objects don't get the extra
        // characters needed to mark their encodings.
        if (!this._isImplicit) {
            _encodingSpec[index] = this._getEncodingIndexAndRegister(encoding);
        }

        this._isImplicit = false;
        if (this.metadata !== undefined) {
            _metadata[index] = this.metadata;
        }
        this.metadata = oldMetadata;
        msg[index] = preszed;
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

    finish() {
        // This returns a message we have so far.
        const wm = this._workingMessage;
        wm[0] = [
            version,
            this._makeEncodingKeys(),
            this._encodingSpec,
            this._metadata
        ];
        return wm;
    }
}

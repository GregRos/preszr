import {
    EncodeContext,
    Encoding,
    fixedIndexProp,
    SpecialEncoding,
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
import { getEncodingKey } from "../encodings/utils";
import { Fixed } from "../encodings/fixed";
import { EncodingStore } from "./store";
import { getUnrecSymbolEncoding } from "../encodings/unrec-symbol";

export class EncodeCtx implements EncodeContext {
    private _encodingKeys = new Map<Encoding, number>();
    private _objectToRef = new Map<object | symbol | string, Reference>();
    private _encodingSpec = Object.create(null);
    private _metadata = Object.create(null);
    private _workingMessage = [{}] as unknown as PreszrFormat;

    _isImplicit = false;
    metadata = undefined;
    constructor(private _store: EncodingStore) {}

    private _getEncodingIndex(encoding: Encoding) {
        if (encoding[fixedIndexProp] != null) {
            return encoding[fixedIndexProp];
        }
        const encodingKeys = this._encodingKeys;
        let encodingIndex = encodingKeys.get(encoding);
        if (encodingIndex == null) {
            encodingIndex = encodingKeys.size + Fixed.End;
            encodingKeys.set(encoding, encodingIndex);
        }
        return encodingIndex;
    }

    private _mustGetBySymbol(s: symbol): SymbolEncoding | SpecialEncoding {
        const inner = this._store.mayGetBySymbol(s);
        if (!inner) {
            return getUnrecSymbolEncoding(s);
        }
        return inner;
    }

    private _createNewRef(value: Entity): Reference {
        const { _workingMessage: msg, _objectToRef, _encodingSpec, _metadata, _store } = this;
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
            this._encodingSpec[index] = this._getEncodingIndex(encoding);
            if (encoding.metadata) {
                this._metadata[index] = encoding.metadata;
            }
            return ref;
        }
        const encoding = _store.mustGetByProto(value);
        const oldMetadata = this.metadata;
        const preszed = encoding.encode(value, this);
        if (!this._isImplicit) {
            _encodingSpec[index] = this._getEncodingIndex(encoding);
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
            encodingKeys.push(getEncodingKey(encoding));
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
        const wm = this._workingMessage;
        wm[0] = [version, this._makeEncodingKeys(), this._encodingSpec, this._metadata];
        return wm;
    }
}

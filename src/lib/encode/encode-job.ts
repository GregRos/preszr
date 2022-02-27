import { EncodeContext, Encoding, fixedIndexProp, PreszrConfig } from "../interface";
import { version } from "../utils";
import {
    Entity,
    noResultPlaceholder,
    PreszrFormat,
    PreszrOutput,
    Reference,
    ScalarValue,
    tryEncodeScalar
} from "../data";
import { arrayEncoding, objectEncoding } from "../encodings";
import { getEncodingKey } from "../encodings/utils";
import { WorkingEncodingCache } from "./encoding-cache";
import { Fixed } from "../encodings/fixed";
import { EncodingStore } from "./store";

export class EncodeCtx implements EncodeContext {
    private _encodingKeys = new Map<Encoding, number>();
    private _objectToRef = new Map<object | symbol | string, Reference>();
    private _encodingSpec = Object.create(null);
    private _metadata = Object.create(null);
    private _workingMessage = [{}] as unknown as PreszrFormat;
    _isImplicit = false;
    metadata = undefined;
    constructor(private _cache: WorkingEncodingCache) {}

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

    private _createNewRef(value: Entity): Reference {
        const { _workingMessage: msg, _objectToRef, _encodingSpec, _metadata, _cache } = this;
        const index = msg.length;
        const ref = `${index}`;
        _objectToRef.set(value, ref);
        if (typeof value === "string") {
            msg.push(value);
            return ref;
        }
        msg.push(0);
        if (typeof value === "symbol") {
            const encoding = _cache.mayGetBySymbol(value);
            this._encodingSpec[index] = this._getEncodingIndex(encoding);
            if (encoding.metadata) {
                this._metadata[index] = encoding.metadata;
            }
            return ref;
        }
        const encoding = _cache.mustGetByProto(value);
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

/**
 * The class used to encode and decode things in the preszr format.
 */
export class PreszrEncode {
    private _encodingKeys = new Map<Encoding, number>();
    private _objectToRef = new Map<object | symbol | string, Reference>();
    private _encodingSpec = Object.create(null);
    private _metadata = Object.create(null);
    private _ctx = this._getEncodeCtx();
    private _workingMessage = [0] as unknown as PreszrFormat;
    constructor(private _cache: WorkingEncodingCache) {}

    private _findEncodingByKeyValue(input: unknown, encodingKey: string) {
        if (encodingKey != null) {
            const encoding = this._cache.mustGetByKey(encodingKey);
            return encoding;
        }
        if (Array.isArray(input)) {
            return arrayEncoding;
        }
        return objectEncoding;
    }

    private _getHeader() {
        return [version, null];
    }

    private _getEncodeCtx(): EncodeContext {
        return {
            metadata: undefined,
            encode: (value: any): ScalarValue => {},
            _isImplicit: false
        };
    }

    encode(root: any): PreszrOutput {
        const tryScalar = tryEncodeScalar(root);
        if (tryScalar !== noResultPlaceholder) {
            return tryScalar;
        }
        const { _ctx, _workingMessage } = this;
        _ctx.encode(root);
        _workingMessage[0] = [
            version,
            this._makeEncodingKeys(),
            this._encodingSpec,
            this._metadata
        ];
        return _workingMessage;
    }
}

export const defaultConfig: PreszrConfig = {
    encodings: [],
    unsupported: []
};

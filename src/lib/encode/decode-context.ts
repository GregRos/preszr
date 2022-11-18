import {
    badType,
    noResultPlaceholder,
    ScalarValue,
    tryDecodeScalar,
    unknownScalar
} from "../data";
import { PrototypeEncoding } from "../interface";
import { getErrorByCode } from "../errors/texts";

enum DecodeStage {
    Create = 0,
    Init
}

export class DecodeContext {
    private _stage = DecodeStage.Create;
    metadata: any;
    self!: PrototypeEncoding;

    constructor(private _entityStream: any[]) {}

    next() {
        this._stage = DecodeStage.Init;
    }

    /**
     * Not part of the public API.
     * @param value Value to decode (MUST be a scalar).
     * @private
     */
    private _decode(value: ScalarValue) {
        const decodedPrimitive = tryDecodeScalar(value);
        switch (decodedPrimitive) {
            case noResultPlaceholder:
                const entity = this._entityStream[value as any];
                return entity;
            case unknownScalar:
                throw getErrorByCode("decode/decode/unknown-scalar")(value);
            case badType:
                throw getErrorByCode("decode/decode/bad-type")(value);
            default:
                return decodedPrimitive;
        }
    }

    /**
     * A fragile way to decode values during the CREATE phase. Not meant
     * to be called from user code.
     *
     * @internal
     * @param value The scalar to decode unsafely.
     */
    decodeUnsafe(value: ScalarValue) {
        if (this._stage === DecodeStage.Init) {
            throw getErrorByCode("decode/decode-unsafe/called-during-init")();
        }
        if (value !== null && typeof value === "object") {
            throw getErrorByCode("decode/decode-unsafe/bad-type")(value);
        }
        return this._decode(value);
    }

    decode(value: ScalarValue): unknown {
        if (this._stage === DecodeStage.Create) {
            throw getErrorByCode("decode/decode/called-during-create")(value);
        }
        if (value !== null && typeof value === "object") {
            throw getErrorByCode("decode/decode/bad-type")(value);
        }
        return this._decode(value);
    }
}

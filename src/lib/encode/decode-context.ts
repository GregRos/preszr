import {
    noResultPlaceholder,
    ResultType,
    ScalarValue,
    tryDecodeScalar
} from "../data";
import {
    decode_encoding_badCall,
    decode_encoding_decode_badType,
    decode_encoding_refOutOfBounds
} from "../errors/texts2";
import { PrototypeEncoding } from "../interface";

enum DecodeStage {
    Create = 0,
    Init
}

export class DecodeContext {
    private _stage = DecodeStage.Create;
    metadata: any;
    self!: PrototypeEncoding;

    constructor(private _entityStream: any[]) {}

    state: any;
    next() {
        this._stage = DecodeStage.Init;
    }

    /**
     * Not part of the public API.
     * @param value Value to decode (MUST be a scalar).
     * @private
     */
    private _decode(value: ScalarValue) {
        const result = tryDecodeScalar(value);
        switch (result.type) {
            case ResultType.Reference:
                if (result.value >= this._entityStream.length) {
                    throw decode_encoding_refOutOfBounds(
                        this.self,
                        result.value
                    );
                }
                return this._entityStream[result.value];
            case ResultType.Scalar:
                return result.value;
            case ResultType.BadType:
                throw decode_encoding_decode_badType(this.self, value);
            default:
                throw new Error("Unexpected result type");
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
            throw decode_encoding_badCall(this.self, "decodeUnsafe", "INIT");
        }
        return this._decode(value);
    }

    decode(value: ScalarValue): unknown {
        if (this._stage === DecodeStage.Create) {
            throw decode_encoding_badCall(this.self, "decode", "CREATE");
        }

        return this._decode(value);
    }
}

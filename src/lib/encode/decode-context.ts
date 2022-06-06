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

    constructor(private _target: any[]) {}

    next() {
        this._stage = DecodeStage.Init;
    }

    decode(value: ScalarValue): unknown {
        if (this._stage === DecodeStage.Create) {
            throw getErrorByCode("decode/create/decode/call")();
        }
        if (value !== null && typeof value === "object") {
            throw getErrorByCode("decode/init/decode/bad-type")(value);
        }
        const decodedPrimitive = tryDecodeScalar(value);
        switch (decodedPrimitive) {
            case noResultPlaceholder:
                return this._target[value as any];
            case unknownScalar:
                throw getErrorByCode("decode/init/decode/unknown-scalar")(
                    value
                );
            case badType:
                throw getErrorByCode("decode/init/decode/bad-type")(value);
            default:
                return decodedPrimitive;
        }
    }
}

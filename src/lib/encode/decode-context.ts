import { noResultPlaceholder, ScalarValue, tryDecodeScalar } from "../data";
import { PreszrError } from "../errors";
import { PrototypeEncoding } from "../interface";

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
            throw new PreszrError(
                "Decoding",
                `Illegal call to 'decode' in the Create stage. You can only do that during the Init stage.`
            );
        }
        const decodedPrimitive = tryDecodeScalar(value);
        if (decodedPrimitive !== noResultPlaceholder) {
            return decodedPrimitive;
        }
        value = value as number;
        return this._target[value];
    }
}

import { CreateContext, InitContext } from "../interface";
import { noResultPlaceholder, ScalarValue, tryDecodeScalar } from "../data";
import { PreszrError } from "../errors";

enum DecodeStage {
    Create = 0,
    Init
}

export class DecodeContext {
    private _stage = DecodeStage.Create;
    metadata: any;
    constructor(private _target: any[]) {}
    next() {
        this._stage = DecodeStage.Init;
    }
    decode(value: ScalarValue): unknown {
        if (this._stage === DecodeStage.Create) {
            throw new PreszrError(`Decode Error - Illegal call to 'decode' in the Create stage.`);
        }
        const decodedPrimitive = tryDecodeScalar(value);
        if (decodedPrimitive !== noResultPlaceholder) {
            return decodedPrimitive;
        }
        value = value as number;
        return this._target[value];
    }
}

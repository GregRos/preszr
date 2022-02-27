import { version } from "../utils";
import { PreszrError } from "../errors";
import { EncodingStore } from "./store";
import {
    EncodingKeys,
    noResultPlaceholder,
    PreszrFormat,
    PreszrOutput,
    tryDecodeScalar
} from "../data";
import { Encoding } from "../interface";
import { Fixed } from "../encodings/fixed";

export class DecodeJob {
    private _encodingsByIndex: Encoding[] = [];

    constructor(private _cache: EncodingStore) {}

    private _mustGetEncodingByIndex(index: number) {
        return index < Fixed.End
            ? this._cache.mustGetByIndex(index)
            : this._encodingsByIndex[index - Fixed.End];
    }

    decode(input: PreszrOutput): unknown {
        const tryScalar = tryDecodeScalar(input);
        if (tryScalar !== noResultPlaceholder) return tryScalar;
        input = input as PreszrFormat;
        this._checkInputHeader(input);
    }
}

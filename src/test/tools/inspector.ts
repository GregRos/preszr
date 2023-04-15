import { PreszrFormat } from "../../lib/data";
import { FixedIndexes } from "@lib/encodings/fixed-indexes";

export class Inspector {
    constructor(private _inner?: PreszrFormat) {
        this._inner ??= [["2", [], {}, {}, 1]];
    }

    get(): PreszrFormat;
    get(i: number): any;
    get(i?: number) {
        if (arguments.length === 0) {
            return this._inner;
        }
        return this._inner[i + 1];
    }

    get length() {
        return this._inner.length - 1;
    }

    setEncoding(newIndex: number, encodingKey: string | number) {
        if (typeof encodingKey === "number") {
            this.spec[newIndex] = encodingKey;
            return this;
        }
        const ix = this.keys.indexOf(encodingKey);
        if (ix < 0) {
            this.keys.push(encodingKey);
            this.spec[newIndex] = FixedIndexes.End + this.keys.length - 1;
        } else {
            this.spec[newIndex] = ix;
        }
    }

    setMetadata(newIndex: number, value: any) {
        this.metadata[newIndex] = value;
    }

    push(v: any, encoding?: string | number, metadata?: any) {
        const newIndex = this.length + 1;
        this._inner.push(v);
        if (encoding != null) {
            this.setEncoding(newIndex, encoding);
        }
        if (metadata != null) {
            this.setMetadata(newIndex, metadata);
        }
    }

    set(i: number, x: any) {
        this._inner[i + 1] = x;
        return this;
    }

    get version() {
        return this._inner[0][0];
    }

    set version(x) {
        this._inner[0][0] = x;
    }

    get keys() {
        return this._inner[0][1];
    }

    set keys(keys) {
        this._inner[0][1] = keys;
    }

    get spec() {
        return this._inner[0][2];
    }

    set spec(x) {
        this._inner[0][2] = x;
    }

    get metadata() {
        return this._inner[0][3];
    }

    set metadata(x) {
        this._inner[0][3] = x;
    }
}

/*
    Message(encoded("abc", axvx), encoded("asdg", axvx))
 */

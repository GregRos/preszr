import test, { TitleFn } from "ava";
import { PreszrFormat } from "@lib/data";
import { Preszr } from "@lib";
import { symmetricTestUsingInner } from "./macros-3";

export interface MacroInputs {
    decoded: any;
    encoded: PreszrFormat;
    title: string;
}

export type TitleFunc = (inputs: MacroInputs) => string;

export class SymmetricTestBuilder {
    private _title: TitleFunc;
    constructor(private _instance: Preszr) {}

    title(f: TitleFunc) {
        this._title = f;
        return this;
    }

    getTitleGetter() {
        const { _title } = this;
        return (title, decoded, encoded) =>
            _title?.({
                encoded,
                decoded,
                title
            }) ?? title;
    }

    encodeDecodeDeepEqual() {
        const { _instance } = this;
        return test.macro({
            exec(t, decoded: any, encoded: PreszrFormat) {
                const toEncoded = _instance.encode(decoded);
                t.deepEqual(toEncoded, encoded, "ENCODED VALUE MISMATCH");
                const toDecoded = _instance.decode(encoded);
                t.deepEqual(toDecoded, decoded, "DECODED VALUE MISMATCH");
            },
            title: this.getTitleGetter()
        });
    }
}


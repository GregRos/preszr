import {SzrOutput} from "../lib/szr-representation";
import test from "ava";
import {decode} from "../lib";
import {Szr} from "../lib/szr";


export function encodeDecodeTest(decoded: any, encoded: SzrOutput, title: string, szr = new Szr()) {
    test(`decode - ${title}`, t => {
        const result = szr.decode(encoded);
        t.deepEqual(result, decoded);
    });

    test(`encode - ${title}`, t => {
        const result = szr.encode(decoded);
        t.deepEqual(result, encoded);
    });
}

import test from "ava";
import {Szr} from "../lib/internal/szr";
import {version} from "../lib/internal/utils";
import {decode} from "../lib";
import {szrDefaultHeader} from "./utils";
import {SzrFormat} from "../lib/internal/szr-representation";

test("non-enumerable properties", t => {
    const szr = new Szr({
        options: {
            alsoNonEnumerable: true
        }
    });

    const o = {};
    Object.defineProperty(o, "test", {
        enumerable: false,
        value: true
    });
    const encoded = szr.encode(o);
    t.deepEqual(encoded, szrDefaultHeader({test: true}));
});
class TestClass {}

test("error - two encodings, identical keys", t => {
    const err = t.throws(() => new Szr({
        encodings: [TestClass, TestClass]
    }));
    t.regex(err.message, /.*TestClass.*already exists/);
});


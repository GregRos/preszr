import test from "ava";
import {Szr} from "../lib/szr";
import {version} from "../lib/utils";
import {decode} from "../lib";
import {szrDefaultHeader} from "./utils";

test("version check disable", t => {
    const szr = new Szr({
        options: {
            skipValidateVersion: true
        }
    });
    const fakeVersion = `${version}1`;
    const badEncoded = [[fakeVersion, {}, {}], {}];
    t.throws(() => decode(badEncoded));
    const result = szr.decode(badEncoded);
    t.deepEqual(result, {});
});

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


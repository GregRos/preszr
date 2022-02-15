import test from "ava";
import {Szr} from "../lib/core";
import {version} from "../lib/utils";
import {decode} from "../lib";
import {szrDefaultHeader} from "./utils";
import {SzrFormat} from "../lib/data-types";

class TestClass {}

test("error - two encodings, identical keys", t => {
    const err = t.throws(() => new Szr({
        encodings: [TestClass, TestClass]
    }));
    t.regex(err.message, /.*TestClass.*already exists/);
});


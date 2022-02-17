import test from "ava";
import { Preszr } from "../lib/core";

class TestClass {}

test("error - two encodings, identical keys", t => {
    const err = t.throws(
        () =>
            new Preszr({
                encodings: [TestClass, TestClass]
            })
    );
    t.regex(err.message, /.*TestClass.*already exists/);
});

import test from "ava";
import { Szr } from "../lib/core";

class TestClass {}

test("error - two encodings, identical keys", (t) => {
    const err = t.throws(
        () =>
            new Szr({
                encodings: [TestClass, TestClass],
            })
    );
    t.regex(err.message, /.*TestClass.*already exists/);
});

import test from "ava";
import { Preszr } from "@lib/core";

class TestClass {}

test("error - two encodings, identical keys", t => {
    t.throws(
        () =>
            new Preszr({
                encodes: [TestClass, TestClass]
            })
    );
});

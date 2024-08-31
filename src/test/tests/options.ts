import { Preszr } from "@lib/core"
import test from "ava"

class TestClass {}

test("error - two encodings, identical keys", t => {
    t.throws(
        () =>
            new Preszr({
                encodes: [TestClass, TestClass]
            })
    )
})

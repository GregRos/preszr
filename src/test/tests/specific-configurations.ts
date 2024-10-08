import { Preszr } from "@lib"
import test from "ava"
import { encoded, items, preszr, testBuilder } from "../tools"

const nameless = class {}

class TestClass {}

{
    const symbol = Symbol("symbol1")
    const inst = Preszr([TestClass, symbol])

    const stdTest = testBuilder(inst).get()
    test("1 SymbolEncoding, 1 PrototypeEncoding", stdTest, {
        original: {
            a: new TestClass(),
            b: symbol
        },
        encoded: preszr(
            items({ a: "2", b: "3" }),
            encoded({}, "TestClass.v1"),
            encoded(0, "symbol1.S")
        )
    })
}
{
    const thisInst = Preszr([
        {
            encodes: TestClass.prototype
        }
    ])
    const thisBuilder = testBuilder(thisInst)
    test("Use prototype property", thisBuilder.get(), {
        original: new TestClass(),
        encoded: preszr(encoded({}, "TestClass.v1"))
    })
}

{
    const thisInst = Preszr([
        {
            encodes: nameless.prototype,
            name: "TestClass"
        }
    ])
    const thisBuilder = testBuilder(thisInst)
    test("Use encoding name", thisBuilder.get(), {
        original: new nameless(),
        encoded: preszr(encoded({}, "TestClass.v1"))
    })
}
{
    const thisInst = Preszr([
        {
            encodes: TestClass.prototype,
            version: 5
        }
    ])
    const thisBuilder = testBuilder(thisInst)
    test("Use version field", thisBuilder.get(), {
        original: new TestClass(),
        encoded: preszr(encoded({}, "TestClass.v5"))
    })
}

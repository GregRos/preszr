import { Preszr } from "@lib";
import { encoded, items, preszr, testBuilder } from "../tools";
import test from "ava";

const nameless = class {};

class TestClass {}

{
    const symbol = Symbol("symbol1");
    const inst = Preszr([TestClass, symbol]);

    const stdTest = testBuilder(inst).get();
    test("1 SymbolEncoding, 1 PrototypeEncoding", stdTest, {
        original: {
            a: new TestClass(),
            b: symbol
        },
        encoded: preszr(
            items({ a: "2", b: "3" }),
            encoded({}, "TestClass.v0"),
            encoded(0, "symbol1.S")
        )
    });
}
{
    const thisInst = Preszr([
        {
            proto: TestClass.prototype
        }
    ]);
    const thisBuilder = testBuilder(thisInst);
    test("Use prototype property", thisBuilder.get(), {
        original: new TestClass(),
        encoded: preszr(encoded({}, "TestClass.v0"))
    });
}

{
    const thisInst = Preszr([
        {
            proto: nameless.prototype,
            name: "TestClass"
        }
    ]);
    const thisBuilder = testBuilder(thisInst);
    test("Use encoding name", thisBuilder.get(), {
        original: new nameless(),
        encoded: preszr(encoded({}, "TestClass.v0"))
    });
}
{
    const thisInst = Preszr([
        {
            proto: TestClass.prototype,
            version: 5
        }
    ]);
    const thisBuilder = testBuilder(thisInst);
    test("Use version field", thisBuilder.get(), {
        original: new TestClass(),
        encoded: preszr(encoded({}, "TestClass.v5"))
    });
}

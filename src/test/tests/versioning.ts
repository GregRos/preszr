import test from "ava";
import { Preszr } from "@lib";
import { encoded, preszr, testBuilder } from "../tools";

class TestClass {}
class TestClass2 {}
{
    const versionedTest = testBuilder(
        Preszr([
            {
                name: "test",
                proto: TestClass.prototype,
                version: 1
            },
            {
                name: "test",
                proto: TestClass2.prototype,
                version: 3
            }
        ])
    );
    test.skip(
        "custom types - two versions - use latest version",
        versionedTest.get(),
        {
            original: new TestClass(),
            encoded: preszr(encoded({}, "test.v3"))
        }
    );

    test.skip("read previous version", t => {});
}
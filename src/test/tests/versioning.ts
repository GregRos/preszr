import { Preszr } from "@lib"
import test from "ava"
import { encoded, preszr, testBuilder } from "../tools"

{
    class TestClass {
        constructor(public val: number) {}
    }

    const versionedPreszr = Preszr([
        {
            encodes: TestClass.prototype,
            version: 1,
            encode(input, ctx) {
                return input.val
            },
            decoder: {
                create(entity) {
                    return new TestClass(entity as any)
                }
            }
        },
        {
            encodes: TestClass.prototype,
            version: 2,
            encode(input) {
                return input.val * 2
            },
            decoder: {
                create(entity: any) {
                    return new TestClass(entity / 2)
                }
            }
        }
    ])

    const versionedTest = testBuilder(versionedPreszr)

    test("two versions, uses latest", versionedTest.get(), {
        original: new TestClass(1),
        encoded: preszr(encoded(2, "TestClass.v2"))
    })

    test("two versions, can still read old one", t => {
        const encodedValue = preszr(encoded(1, "TestClass.v1"))
        const original = versionedPreszr.decode(encodedValue)
        t.deepEqual(original, new TestClass(1))
    })
}

{
    class TestClass2 {}

    class TestClass {}

    const twoDifferentVersionClasses = Preszr([
        {
            name: "test",
            encodes: TestClass.prototype
        },
        {
            name: "test",
            version: 2,
            encodes: TestClass2.prototype
        }
    ])
    const differentClassesTest = testBuilder(twoDifferentVersionClasses)

    test("uses new version", differentClassesTest.get(), {
        original: new TestClass2(),
        encoded: preszr(encoded({}, "test.v2"))
    })

    test("can still read old version", differentClassesTest.get(), {
        original: new TestClass(),
        encoded: preszr(encoded({}, "test.v1"))
    })
}

/* tslint:disable:no-construct */
import test from "ava";
import { getImplicitClassEncodingKey } from "../utils";
import { Preszr } from "@lib";
import { encoded, items, preszr, testBuilder } from "../tools";
import { Fixed } from "@lib/encodings/fixed";

class ParentClass {
    constructor(obj = {}) {
        Object.assign(this, obj);
    }
}

class ChildClass extends ParentClass {}
const parentClassEncodingName = getImplicitClassEncodingKey("ParentClass");
const childClassEncodingName = getImplicitClassEncodingKey("ChildClass");
test("deepEqual distinguishes prototypes", t => {
    t.notDeepEqual(new ParentClass(), {});
    t.notDeepEqual(new ChildClass(), {});
    t.notDeepEqual(new ParentClass(), new ChildClass());
});

const builder = testBuilder();

// Unknown TestClass encoded as regular object
test("Unknown prototype", builder.get(), {
    original: new ParentClass(),
    encoded: preszr(items({})),
    // Decoded output expected to be different from original:
    decoded: {}
});

{
    const testWithParent = builder.instance(Preszr(ParentClass)).get();

    test("known prototype", testWithParent, {
        original: new ParentClass({ a: 1 }),
        encoded: preszr(encoded({ a: 1 }, parentClassEncodingName))
        // Here decoded output is supposed to be the same
    });

    test("subclass of known prototype", testWithParent, {
        original: new ChildClass({ a: 2 }),
        encoded: preszr(encoded({ a: 2 }, parentClassEncodingName)),
        decoded: new ParentClass({ a: 2 })
    });
}

{
    const testWithBoth = builder
        .instance(Preszr(ParentClass, ChildClass))
        .get();

    test("both classes", testWithBoth, {
        original: { a: new ParentClass({ a: 1 }), b: new ChildClass({ a: 2 }) },
        encoded: preszr(
            items({ a: "2", b: "3" }),
            encoded({ a: 1 }, parentClassEncodingName),
            encoded({ a: 2 }, childClassEncodingName)
        )
    });

    class ChildChildClass extends ChildClass {}

    test("unknown child child class matches nearest", testWithBoth, {
        original: new ChildChildClass({ a: 3 }),
        encoded: preszr(encoded({ a: 3 }, childClassEncodingName)),
        decoded: new ChildClass({ a: 3 })
    });
}

{
    const testForNullProtoObject = builder.eqAssertion(
        (t, decoded, original) => {
            t.deepEqual(decoded, original);
            t.is(Object.getPrototypeOf(decoded), null);
        }
    );

    test("null prototype object", testForNullProtoObject.get(), {
        original: Object.create(null, {
            a: {
                value: 5,
                enumerable: true
            }
        }),
        encoded: preszr(encoded({ a: 5 }, Fixed.NullProto))
    });
}

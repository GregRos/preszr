/* tslint:disable:no-construct */
import test from "ava";
import {
    encodeDecodeMacro,
    testDecodeMacroBindPreszr,
    testEncodeMacro,
    testEncodeMacroBindPreszr
} from "../utils";
import { decode, Preszr } from "@lib";
import { getImplicitClassEncodingName, version } from "@lib/utils";
import { nullPrototypeEncoding } from "@lib/encodings/basic";

class TestClass {
    constructor(obj = {}) {
        Object.assign(this, obj);
    }
}

class TestSubclass extends TestClass {}

test("deepEqual distinguishes prototypes", t => {
    t.notDeepEqual(new TestClass(), {});
    t.notDeepEqual(new TestSubclass(), {});
    t.notDeepEqual(new TestClass(), new TestSubclass());
});

test(
    "unknown prototype",
    encodeDecodeMacro({
        decode(t, decoded, encoded) {
            const rDecoded = decode(encoded);
            t.deepEqual(rDecoded, {});
        },
        encode: testEncodeMacro
    }),
    new TestClass(),
    [[{}, {}], {}]
);

const preszrWithTestClass = new Preszr({
    encodings: [TestClass]
});
test(
    "known prototype",
    encodeDecodeMacro({
        encode: testEncodeMacroBindPreszr(preszrWithTestClass),
        decode: testEncodeMacroBindPreszr(preszrWithTestClass)
    }),
    new TestClass({ a: 1 }),
    [[{ 1: getImplicitClassEncodingName("TestClass") }, {}], { a: 1 }]
);

test(
    "subclass of known prototype",
    encodeDecodeMacro({
        encode: testEncodeMacroBindPreszr(preszrWithTestClass),
        decode(t, decoded, encoded) {
            const rDecoded = preszrWithTestClass.decode(encoded);
            t.deepEqual(rDecoded, new TestClass({ a: 1 }));
            t.is(Object.getPrototypeOf(rDecoded), TestClass.prototype);
        }
    }),
    new TestSubclass({ a: 1 }),
    [[{ 1: getImplicitClassEncodingName("TestClass") }, {}], { a: 1 }]
);

const preszrWithSubclass = new Preszr({
    encodings: [TestClass, TestSubclass]
});

class TestSubSubclass extends TestSubclass {}

test(
    "unknown class matches nearest subclass",
    encodeDecodeMacro({
        encode: testEncodeMacroBindPreszr(preszrWithSubclass),
        decode(t, decoded, encoded) {
            const rDecoded = preszrWithSubclass.decode(encoded);
            t.deepEqual(rDecoded, new TestSubclass());
        }
    }),
    new TestSubSubclass(),
    [[{ 1: getImplicitClassEncodingName(`TestSubclass`) }, {}], {}]
);

test(
    "two different classes",
    encodeDecodeMacro({
        encode: testEncodeMacroBindPreszr(preszrWithSubclass),
        decode: testDecodeMacroBindPreszr(preszrWithSubclass)
    }),
    {
        a: new TestClass({ b: new TestSubclass() })
    },
    [
        [
            {
                2: getImplicitClassEncodingName("TestClass"),
                3: getImplicitClassEncodingName("TestSubclass")
            },
            {}
        ],
        { a: "2" },
        { b: "3" },
        {}
    ]
);

test(
    "null prototype object",
    encodeDecodeMacro({
        encode: testEncodeMacro,
        decode(t, decoded, encoded) {
            const rDecoded = decode(encoded);
            t.is(Object.getPrototypeOf(rDecoded), null);
            t.deepEqual(rDecoded, {});
        }
    }),
    Object.create(null),
    [[{ 1: nullPrototypeEncoding.name }, {}], {}]
);

test("override prototype", t => {
    const preszr = new Preszr({
        encodings: [
            TestClass,
            {
                name: "override",
                prototype: TestClass.prototype,
                encode: () => 5,
                decoder: {
                    create: () => 5
                }
            }
        ]
    });

    const encoded = preszr.encode(new TestClass());
    t.deepEqual(encoded, [[version, ["override"], { 1: 0 }, {}], 5]);
    const decoded = preszr.decode(encoded);
    t.is(decoded, 5);
});

test("override built-in prototype", t => {
    const preszr = new Preszr({
        encodings: [
            {
                prototype: Date.prototype,
                name: "/Date",
                encode: () => 5,
                decoder: {
                    create: () => 5
                }
            }
        ]
    });

    const encoded = preszr.encode(new Date());
    t.deepEqual(encoded, [[version, ["new-date"], { 1: 0 }, {}], 5]);
    t.is(preszr.decode(encoded), 5);
});

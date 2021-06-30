/* tslint:disable:no-construct */
import test from "ava";
import {encodeDecodeMacro, testDecodeMacroBindSzr, testEncodeMacro, testEncodeMacroBindSzr} from "./utils";
import {decode} from "../lib";
import {Szr} from "../lib/szr";
import {getImplicitClassEncodingName} from "../lib/utils";
import {nullPrototypeEncoding} from "../lib/encodings/basic";

class TestClass {
    constructor(obj = {}) {
        Object.assign(this, obj);
    }
}

class TestSubclass extends TestClass {

}

test("deepEqual distinguishes prototypes", t => {
    t.notDeepEqual(new TestClass(), {});
    t.notDeepEqual(new TestSubclass(), {});
    t.notDeepEqual(new TestClass(), new TestSubclass());
});

test("unknown prototype", encodeDecodeMacro({
    decode(t, decoded, encoded) {
        const rDecoded = decode(encoded);
        t.deepEqual(rDecoded, {});
    },
    encode: testEncodeMacro
}), new TestClass(), [[{}, {}], {}]);

const szrWithTestClass = new Szr({
    encodings: [TestClass]
});
test("known prototype", encodeDecodeMacro({
    encode: testEncodeMacroBindSzr(szrWithTestClass),
    decode: testEncodeMacroBindSzr(szrWithTestClass)
}), new TestClass({a: 1}), [[{1: getImplicitClassEncodingName("TestClass")}, {}], {a: 1}]);


test("subclass of known prototype", encodeDecodeMacro({
    encode: testEncodeMacroBindSzr(szrWithTestClass),
    decode(t, decoded, encoded) {
        const rDecoded = szrWithTestClass.decode(encoded);
        t.deepEqual(rDecoded, new TestClass({a: 1}));
        t.is(Object.getPrototypeOf(rDecoded), TestClass.prototype);
    }
}), new TestSubclass({a: 1}), [[{1: getImplicitClassEncodingName("TestClass")}, {}], {a: 1}]);

const szrWithSubclass = new Szr({
    encodings: [
        TestClass,
        TestSubclass
    ]
});

class TestSubSubclass extends TestSubclass {

}

test("unknown class matches nearest subclass", encodeDecodeMacro({
    encode: testEncodeMacroBindSzr(szrWithSubclass),
    decode(t, decoded, encoded) {
        const rDecoded = szrWithSubclass.decode(encoded);
        t.deepEqual(rDecoded, new TestSubclass());
    }
}), new TestSubSubclass(), [[{1: getImplicitClassEncodingName(`TestSubclass`)}, {}], {}]);

test("two different classes", encodeDecodeMacro({
    encode: testEncodeMacroBindSzr(szrWithSubclass),
    decode: testDecodeMacroBindSzr(szrWithSubclass)
}), {
    a: new TestClass({b: new TestSubclass()})
}, [
    [{
        2: getImplicitClassEncodingName("TestClass"),
        3: getImplicitClassEncodingName("TestSubclass")
    }, {}],
    {a: "2"},
    {b: "3"},
    {}
]);

test("null prototype object", encodeDecodeMacro({
    encode: testEncodeMacro,
    decode(t, decoded, encoded) {
        const rDecoded = decode(encoded);
        t.is(Object.getPrototypeOf(rDecoded), null);
        t.deepEqual(rDecoded, {});
    }
}), Object.create(null), [[{1: nullPrototypeEncoding.key}, {}], {}]);




// TODO: Add tests for override
// TODO: Duplicate keys
// TODO: override default, override unsupported

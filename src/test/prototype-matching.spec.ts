import test, {ExecutionContext, Implementation, UntitledMacro} from "ava";
import {createWithTitle, embedSzrVersion, testDecodeMacro, testEncodeMacro, testEncodeMacroBindSzr} from "./utils";
import {decode, encode} from "../lib";
import {Szr} from "../lib/szr";
import {getImplicitClassEncodingName} from "../lib/utils";

class TestClass {
    constructor(obj = {}) {
        Object.assign(this, obj);
    }
}

class TestSubclass extends TestClass {

}

interface EncodeDecodeMacros {
    decode(t: ExecutionContext, decoded, encoded);

    encode(t: ExecutionContext, decoded, encoded);
}

const macroThing2 = (args: EncodeDecodeMacros) => {
    return [
        createWithTitle(args.encode, (decoded, encoded, szr) => [decoded, embedSzrVersion(encoded), szr], title => `encode :: ${title}`),
        createWithTitle(args.decode, (decoded, encoded, szr) => [decoded, embedSzrVersion(encoded), szr], title => `decode :: ${title}`)
    ] as [any, any];
};

test("deepEqual distinguishes prototypes", t => {
    t.notDeepEqual(new TestClass(), {});
    t.notDeepEqual(new TestSubclass(), {});
    t.notDeepEqual(new TestClass(), new TestSubclass());
});

test("unknown prototype", macroThing2({
    decode(t, decoded, encoded) {
        const rDecoded = decode(encoded);
        t.deepEqual(rDecoded, {});
    },
    encode: testEncodeMacro
}), new TestClass(), [[{}, {}], {}]);

const szrWithTestClass = new Szr({
    encodings: [TestClass]
});
test("known prototype", macroThing2({
    encode: testEncodeMacroBindSzr(szrWithTestClass),
    decode: testEncodeMacroBindSzr(szrWithTestClass)
}), new TestClass({a: 1}), [[{1: getImplicitClassEncodingName("TestClass")}, {}], {a: 1}]);


test("subclass of known prototype", macroThing2({
    encode: testEncodeMacroBindSzr(szrWithTestClass),
    decode(t, decoded, encoded) {
        const rDecoded = szrWithTestClass.decode(encoded);
        t.deepEqual(rDecoded, new TestClass({a: 1}));
        t.is(Object.getPrototypeOf(rDecoded), TestClass.prototype);
    }
}), new TestSubclass({a: 1}), [[{1: getImplicitClassEncodingName("TestClass")}, {}], {a: 1}]);


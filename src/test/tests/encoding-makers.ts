import test from "ava";
import { PrototypeEncoding, SymbolSpecifier } from "@lib";
import {
    getImplicitClassEncodingName,
    getBuiltInEncodingName,
    getClass
} from "@lib/utils";
import { getDummyCtx } from "../utils";
import { SymbolEncoding } from "@lib/interface";
import { getDefaultStore } from "@lib/encodings";
import { UserEncoding } from "@lib/encodings/encoding";

const testSymbol = Symbol("test");
const defaultStore = getDefaultStore();
class TestClass {
    field = 5;
}

class TestClass2 {
    field = 10;
}

// This is so deepEqual won't just treat the classes as {}
TestClass.prototype.field = 5;
TestClass2.prototype.field = 10;

test("implicit class encoding name", t => {
    t.is(getBuiltInEncodingName("test"), "/test");
});

test("from symbol with name", t => {
    const encoding = SymbolEncoding.fromSymbol(testSymbol);
    t.deepEqual(encoding, new SymbolEncoding("test", testSymbol));
});

test("error when trying with symbol without name", t => {
    // eslint-disable-next-line symbol-description
    t.throws(() => SymbolEncoding.fromSymbol(Symbol()));
});

test("symbol encoding with explicit name unchanged", t => {
    const spec: SymbolSpecifier = {
        name: "a",
        symbol: testSymbol
    };
    t.deepEqual(
        defaultStore.makeEncoding(spec),
        new SymbolEncoding("a", testSymbol)
    );
});

test("encoding from class", t => {
    const encoding = defaultStore.makeEncoding(TestClass) as PrototypeEncoding;
    t.is(encoding.name, "TestClass");
    t.is(encoding.encodes, TestClass.prototype);
    const dummyCtx = getDummyCtx();
    const result = encoding.encode(new TestClass(), dummyCtx);
    t.deepEqual(result, { field: 5 });
});

test("encoding from prototype", t => {
    const encoding = defaultStore.makeEncoding({
        encodes: TestClass.prototype
    }) as PrototypeEncoding;
    t.is(encoding.name, "TestClass");
    t.is(encoding.encodes, TestClass.prototype);
    const dummyCtx = getDummyCtx();
    const result = encoding.encode(new TestClass(), dummyCtx);
    t.deepEqual(result, { field: 5 });
});

test("error - nameless ctor without key", t => {
    const err = t.throws(() => defaultStore.makeEncoding(class {}));
});

test("error - cannot get prototype from ctor", t => {
    const brokenCtor = function () {};
    brokenCtor.prototype = null;
    const err = t.throws(() => defaultStore.makeEncoding(brokenCtor));
});

test("error - no prototype(s)", t => {
    const err = t.throws(() => defaultStore.makeEncoding({} as any));

    t.regex(err.message, /one of the properties/);
});

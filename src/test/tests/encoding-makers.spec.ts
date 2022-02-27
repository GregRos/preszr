import test from "ava";
import { PrototypeEncoding, SymbolEncoding } from "../../lib";
import { getImplicitClassEncodingName, getLibraryEncodingName } from "../../lib/utils";
import { getDummyCtx } from "../utils";
import { makeFullEncoding } from "../../lib/encodings/utils";

const testSymbol = Symbol("test");

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
    t.is("test", getLibraryEncodingName("symbol-test"));
});

test("implicit symbol encoding name", t => {
    t.is(getImplicitClassEncodingName("test"), getLibraryEncodingName("class-test"));
});

test("from symbol with name", t => {
    const encoding = makeFullEncoding(testSymbol);
    t.deepEqual(encoding, {
        name: "test",
        symbol: testSymbol
    });
});

test("error when trying with symbol without name", t => {
    // eslint-disable-next-line symbol-description
    const err = t.throws(() => makeFullEncoding(Symbol()));
    t.true(err.message.includes(`Failed to detect symbol name`));
});

test("symbol encoding with explicit name unchanged", t => {
    const encoding: SymbolEncoding = {
        name: "a",
        symbol: testSymbol
    };
    t.deepEqual(encoding, makeFullEncoding(encoding));
});

test("encoding from class", t => {
    const encoding = makeFullEncoding(TestClass) as PrototypeEncoding;
    t.is(encoding.name, getImplicitClassEncodingName("TestClass"));
    t.is(encoding.prototypes.length, 1);
    t.is(encoding.prototypes[0], TestClass.prototype);
    const dummyCtx = getDummyCtx();
    const result = encoding.encode(new TestClass(), dummyCtx);
    t.deepEqual(result, { field: 5 });
});

test("encoding from prototype", t => {
    const encoding = makeFullEncoding({
        prototype: TestClass.prototype
    }) as PrototypeEncoding;
    t.is(encoding.name, getImplicitClassEncodingName("TestClass"));
    t.is(encoding.prototypes.length, 1);
    const [p1] = encoding.prototypes;
    t.is(p1, TestClass.prototype);
    const dummyCtx = getDummyCtx();
    const result = encoding.encode(new TestClass(), dummyCtx);
    t.deepEqual(result, { field: 5 });
});

test("encoding with multiple prototypes", t => {
    const f = () => 1;
    const encoding = makeFullEncoding({
        prototypes: [class {}, TestClass.prototype],
        version: 0,
        name: "blah",
        encode: f,
        decoder: {
            create: f
        }
    }) as PrototypeEncoding;

    t.is(encoding.name, "blah");
    t.is(encoding.decoder.create, f);
    t.is(encoding.encode, f);
});

test("encoding prototype field", t => {
    const encoding = makeFullEncoding({
        prototype: TestClass.prototype
    }) as PrototypeEncoding;
    t.is(encoding.name, getImplicitClassEncodingName("TestClass"));
    t.deepEqual(encoding.decoder.create({}, {} as any), Object.create(TestClass.prototype));
});

test("error - nameless ctor without key", t => {
    const err = t.throws(() => makeFullEncoding(class {}));
    t.true(err.message.includes("no name"));
});

test("error - cannot get prototype from ctor", t => {
    const brokenCtor = function () {};
    brokenCtor.prototype = null;
    const err = t.throws(() => makeFullEncoding(brokenCtor));
    t.regex(err.message, /prototype from constructor/);
});

test("error - multiple prototypes provide key", t => {
    const err = t.throws(() =>
        makeFullEncoding({
            prototypes: [{}, {}],
            encode: (() => {}) as any,
            decoder: {} as any
        } as any)
    );
    t.regex(err.message, /provide a key/);
});

test("error - multiple prototypes, provide encoder/decoder", t => {
    const err = t.throws(() =>
        makeFullEncoding({
            prototypes: [{}, {}],
            key: "blah"
        } as any)
    );
    t.regex(err.message, /decoder.*encode/);
});

test("error - no prototype(s)", t => {
    const err = t.throws(() => makeFullEncoding({} as any));

    t.regex(err.message, /specify prototypes/);
});

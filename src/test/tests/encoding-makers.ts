import test from "ava";
import { PrototypeEncoding, SymbolEncoding } from "@lib";
import {
    getImplicitClassEncodingName,
    getBuiltInEncodingName
} from "@lib/utils";
import { getDummyCtx } from "../utils";

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
    t.is(getBuiltInEncodingName("test"), "Preszr/test");
});

test("from symbol with name", t => {
    const encoding = mustMakeEncoding(testSymbol);
    t.deepEqual(encoding, {
        name: "test",
        symbol: testSymbol
    });
});

test("error when trying with symbol without name", t => {
    // eslint-disable-next-line symbol-description
    const err = t.throws(() => mustMakeEncoding(Symbol()));
    t.true(err.message.includes(`no name`));
});

test("symbol encoding with explicit name unchanged", t => {
    const encoding: SymbolEncoding = {
        name: "a",
        symbol: testSymbol
    };
    t.deepEqual(encoding, mustMakeEncoding(encoding) as SymbolEncoding);
});

test("encoding from class", t => {
    const encoding = mustMakeEncoding(TestClass) as PrototypeEncoding;
    t.is(encoding.name, "TestClass");
    t.is(encoding.protos.length, 1);
    t.is(encoding.protos[0], TestClass.prototype);
    const dummyCtx = getDummyCtx();
    const result = encoding.encode(new TestClass(), dummyCtx);
    t.deepEqual(result, { field: 5 });
});

test("encoding from prototype", t => {
    const encoding = mustMakeEncoding({
        encodes: TestClass.prototype
    }) as PrototypeEncoding;
    t.is(encoding.name, "TestClass");
    t.is(encoding.protos.length, 1);
    const [p1] = encoding.protos;
    t.is(p1, TestClass.prototype);
    const dummyCtx = getDummyCtx();
    const result = encoding.encode(new TestClass(), dummyCtx);
    t.deepEqual(result, { field: 5 });
});

test("encoding with multiple prototypes", t => {
    const f = () => 1;
    const encoding = mustMakeEncoding({
        protos: [class {}, TestClass.prototype],
        version: 5,
        name: "blah",
        encode: f,
        decoder: {
            create: f
        }
    }) as PrototypeEncoding;

    t.is(encoding.name, "blah");
    t.is(encoding.version, 5);
    t.is(encoding.decoder.create, f);
    t.is(encoding.encode, f);
});

test("encoding prototype field", t => {
    const encoding = mustMakeEncoding({
        encodes: TestClass.prototype
    }) as PrototypeEncoding;
    t.is(encoding.name, getImplicitClassEncodingName("TestClass"));
    t.deepEqual(
        encoding.decoder.create({}, {} as any),
        Object.create(TestClass.prototype)
    );
});

test("error - nameless ctor without key", t => {
    const err = t.throws(() => mustMakeEncoding(class {}));
    t.true(err.message.includes("get the prototype's name"));
});

test("error - cannot get prototype from ctor", t => {
    const brokenCtor = function () {};
    brokenCtor.prototype = null;
    const err = t.throws(() => mustMakeEncoding(brokenCtor));
    t.regex(err.message, /prototype from constructor/);
});

test("error - multiple prototypes provide key", t => {
    const err = t.throws(() =>
        mustMakeEncoding({
            version: 0,
            protos: [{}, {}],
            encode: (() => {}) as any,
            decoder: {} as any
        } as any)
    );
    t.regex(err.message, /provide a name/);
});

test("error - multiple prototypes, provide encoder/decoder", t => {
    const err = t.throws(() =>
        mustMakeEncoding({
            version: 1,
            protos: [{}, {}],
            key: "blah"
        } as any)
    );
    t.regex(err.message, /decoder.*encode/);
});

test("error - no prototype(s)", t => {
    const err = t.throws(() => mustMakeEncoding({} as any));

    t.regex(err.message, /one of the properties/);
});

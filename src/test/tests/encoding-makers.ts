import { PrototypeEncoding, SymbolSpecifier } from "@lib"
import { getDefaultStore } from "@lib/encodings"
import { SymbolEncoding } from "@lib/interface"
import { getBuiltInEncodingName } from "@lib/utils"
import test from "ava"
import { getDummyCtx } from "../utils"

const testSymbol = Symbol("test")
const defaultStore = getDefaultStore()
class TestClass {
    field = 5
}

class TestClass2 {
    field = 10
}

// This is so deepEqual won't just treat the classes as {}
TestClass.prototype.field = 5
TestClass2.prototype.field = 10

test("implicit class encoding name", t => {
    t.is(getBuiltInEncodingName("test"), "/test")
})

test("from symbol with name", t => {
    const encoding = SymbolEncoding.fromSymbol(testSymbol)
    t.deepEqual(encoding, new SymbolEncoding("test", testSymbol))
})

test("error when trying with symbol without name", t => {
    // eslint-disable-next-line symbol-description
    t.throws(() => SymbolEncoding.fromSymbol(Symbol()))
})

test("symbol encoding with explicit name unchanged", t => {
    const spec: SymbolSpecifier<symbol> = {
        name: "a",
        encodes: testSymbol
    }
    t.deepEqual(defaultStore.makeEncoding(spec), new SymbolEncoding("a", testSymbol))
})

test("encoding from class", t => {
    const encoding = defaultStore.makeEncoding(TestClass) as PrototypeEncoding
    t.is(encoding.name, "TestClass")
    t.is(encoding.encodes, TestClass.prototype)
    const dummyCtx = getDummyCtx()
    const result = encoding.encoder.encode(new TestClass(), dummyCtx)
    t.deepEqual(result, { field: 5 })
})

test("encoding from prototype", t => {
    const encoding = defaultStore.makeEncoding({
        encodes: TestClass.prototype
    }) as PrototypeEncoding
    t.is(encoding.name, "TestClass")
    t.is(encoding.encodes, TestClass.prototype)
    const dummyCtx = getDummyCtx()
    const result = encoding.encoder.encode(new TestClass(), dummyCtx)
    t.deepEqual(result, { field: 5 })
})

test("error - nameless ctor without key", t => {
    t.throws(() => defaultStore.makeEncoding(class {}))
})

test("error - cannot get prototype from ctor", t => {
    const brokenCtor = function () {}
    brokenCtor.prototype = null
    t.throws(() => defaultStore.makeEncoding(brokenCtor))
})

test("error - no prototype(s)", t => {
    t.throws(() => defaultStore.makeEncoding({} as any))
})

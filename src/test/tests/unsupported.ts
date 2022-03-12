import { createPreszrRep, testEncodeMacro } from "../utils";
import { unsupportedEncodingKey } from "@lib/encodings/objects";
import test from "ava";
import { decode } from "../../lib";

const unsupportedObjectProperty = name =>
    createPreszrRep([{ 2: unsupportedEncodingKey }, { 2: name }], { a: "2" }, 0);

test(
    "unsupported - {a: function}",
    testEncodeMacro,
    { a() {} },
    unsupportedObjectProperty("Function")
);
test(
    "unsupported - {a: WeakMap}",
    testEncodeMacro,
    { a: new WeakMap() },
    unsupportedObjectProperty("WeakMap")
);
test(
    "unsupported - {a: WeakSet}",
    testEncodeMacro,
    { a: new WeakSet() },
    unsupportedObjectProperty("WeakSet")
);

const unsupported = name => createPreszrRep([{ 1: unsupportedEncodingKey }, { 1: name }], 0);

test("unsupported - function", testEncodeMacro, () => {}, unsupported("Function"));
test("unsupported - WeakMap", testEncodeMacro, new WeakMap(), unsupported("WeakMap"));
test("unsupported - WeakSet", testEncodeMacro, new WeakSet(), unsupported("WeakSet"));

test("decode unsupported", t => {
    const unsupported = unsupportedObjectProperty("Function");
    const result = decode(unsupported);
    t.deepEqual(result, { a: undefined });
});

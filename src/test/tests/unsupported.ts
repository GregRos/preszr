import { createPreszrRep, testEncodeMacro } from "../utils";
import { unsupportedEncodingName } from "@lib/encodings/objects";
import test from "ava";
import { decode } from "@lib";

const unsKey = `${unsupportedEncodingName}.v0`;
const unsupportedObjectProperty = name =>
    createPreszrRep([{ 2: unsKey }, { 2: name }], { a: "2" }, 0);

test.skip(
    "unsupported - {a: function}",
    testEncodeMacro,
    { a() {} },
    unsupportedObjectProperty("Function")
);
test.skip(
    "unsupported - {a: WeakMap}",
    testEncodeMacro,
    { a: new WeakMap() },
    unsupportedObjectProperty("WeakMap")
);
test.skip(
    "unsupported - {a: WeakSet}",
    testEncodeMacro,
    { a: new WeakSet() },
    unsupportedObjectProperty("WeakSet")
);

const unsupported = name =>
    createPreszrRep([{ 1: unsupportedEncodingName }, { 1: name }], 0);

test.skip(
    "unsupported - function",
    testEncodeMacro,
    () => {},
    unsupported("Function")
);
test.skip(
    "unsupported - WeakMap",
    testEncodeMacro,
    new WeakMap(),
    unsupported("WeakMap")
);
test.skip(
    "unsupported - WeakSet",
    testEncodeMacro,
    new WeakSet(),
    unsupported("WeakSet")
);

test.skip("decode unsupported", t => {
    const unsupported = unsupportedObjectProperty("Function");
    const result = decode(unsupported);
    t.deepEqual(result, { a: undefined });
});

import {createSzrRep, testEncodeMacro} from "./utils";
import {unsupportedEncodingKey} from "../lib/encodings/basic";
import test from "ava";

const unsupportedObjectProperty = name => createSzrRep([{2: unsupportedEncodingKey}, {2: name}], {a: "2"}, null);

test("unsupported - {a: function}", testEncodeMacro, {a() {}}, unsupportedObjectProperty("Function"));
test("unsupported - {a: WeakMap}", testEncodeMacro, {a: new WeakMap()}, unsupportedObjectProperty("WeakMap"));
test("unsupported - {a: WeakSet}", testEncodeMacro, {a: new WeakSet()}, unsupportedObjectProperty("WeakSet"));

const unsupported = name => createSzrRep([{1: unsupportedEncodingKey}, {1: name}], null);

test("unsupported - function", testEncodeMacro, () => {}, unsupported("Function"));
test("unsupported - WeakMap", testEncodeMacro, new WeakMap(), unsupported("WeakMap"));
test("unsupported - WeakSet", testEncodeMacro, new WeakSet(), unsupported("WeakSet"));

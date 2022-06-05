import test from "ava";
import { decode } from "@lib";
import { encoded, preszr, testBuilder } from "../tools";
import { defaultPreszr } from "@lib/default";
import { Fixed } from "@lib/encodings/fixed";
import { PreszrUnsupportedValue } from "@lib/interface";

const compare = testBuilder(defaultPreszr).get();

test("unsupported - function", compare, {
    original: function () {},
    encoded: preszr(encoded(0, Fixed.Function)),
    decoded: new PreszrUnsupportedValue("Function")
});

test("unsupported - WeakMap", compare, {
    original: new WeakMap(),
    encoded: preszr(encoded(0, Fixed.WeakMap)),
    decoded: new PreszrUnsupportedValue("WeakMap")
});

test("unsupported - WeakSet", compare, {
    original: new WeakSet(),
    encoded: preszr(encoded(0, Fixed.WeakSet)),
    decoded: new PreszrUnsupportedValue("WeakSet")
});

test("unsupported - WeakRef", compare, {
    original: new WeakRef({}),
    encoded: preszr(encoded(0, Fixed.WeakRef)),
    decoded: new PreszrUnsupportedValue("WeakRef")
});

test("unsupported - GeneratorFunction", compare, {
    original: function* () {},
    encoded: preszr(encoded(0, Fixed.GeneratorFunction)),
    decoded: new PreszrUnsupportedValue("GeneratorFunction")
});

test("unsupported - Generator", compare, {
    original: (function* () {})(),
    encoded: preszr(encoded(0, Fixed.Generator)),
    decoded: new PreszrUnsupportedValue("Generator")
});

test("unsupported - Promise", compare, {
    original: Promise.resolve(),
    encoded: preszr(encoded(0, Fixed.Promise)),
    decoded: new PreszrUnsupportedValue("Promise")
});

test("unsupported - AsyncGeneratorFunction", compare, {
    original: async function* () {},
    encoded: preszr(encoded(0, Fixed.AsyncGeneratorFunction)),
    decoded: new PreszrUnsupportedValue("AsyncGeneratorFunction")
});

test("unsupported - AsyncGenerator", compare, {
    original: (async function* () {})(),
    encoded: preszr(encoded(0, Fixed.AsyncGenerator)),
    decoded: new PreszrUnsupportedValue("AsyncGenerator")
});

test("unsupported - FinalizationRegistry", compare, {
    original: new FinalizationRegistry(() => {}),
    encoded: preszr(encoded(0, Fixed.FinalizationRegistry)),
    decoded: new PreszrUnsupportedValue("FinalizationRegistry")
});

test("unsupported - AsyncFunction", compare, {
    original: async function () {},
    encoded: preszr(encoded(0, Fixed.AsyncFunction)),
    decoded: new PreszrUnsupportedValue("AsyncFunction")
});

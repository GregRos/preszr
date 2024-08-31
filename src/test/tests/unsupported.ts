import test from "ava";
import { encoded, preszr, testBuilder } from "../tools";
import { defaultPreszr } from "@lib/default";
import { FixedIndexes } from "@lib/encodings/fixed-indexes";
import { PreszrUnsupportedValue } from "@lib/interface";

const compare = testBuilder(defaultPreszr).get();

test("unsupported - function", compare, {
    original: function () {},
    encoded: preszr(encoded(0, FixedIndexes.Function)),
    decoded: new PreszrUnsupportedValue("Function")
});

test("unsupported - WeakMap", compare, {
    original: new WeakMap(),
    encoded: preszr(encoded(0, FixedIndexes.WeakMap)),
    decoded: new PreszrUnsupportedValue("WeakMap")
});

test("unsupported - WeakSet", compare, {
    original: new WeakSet(),
    encoded: preszr(encoded(0, FixedIndexes.WeakSet)),
    decoded: new PreszrUnsupportedValue("WeakSet")
});

test("unsupported - WeakRef", compare, {
    original: new WeakRef({}),
    encoded: preszr(encoded(0, FixedIndexes.WeakRef)),
    decoded: new PreszrUnsupportedValue("WeakRef")
});

test("unsupported - Promise", compare, {
    original: Promise.resolve(),
    encoded: preszr(encoded(0, FixedIndexes.Promise)),
    decoded: new PreszrUnsupportedValue("Promise")
});

test("unsupported - FinalizationRegistry", compare, {
    original: new FinalizationRegistry(() => {}),
    encoded: preszr(encoded(0, FixedIndexes.FinalizationRegistry)),
    decoded: new PreszrUnsupportedValue("FinalizationRegistry")
});

test("unsupported - ArrayIterator", compare, {
    original: [][Symbol.iterator](),
    encoded: preszr(encoded(0, FixedIndexes.ArrayIterator)),
    decoded: new PreszrUnsupportedValue("Array Iterator")
});

test("unsupported - SetIterator", compare, {
    original: new Set()[Symbol.iterator](),
    encoded: preszr(encoded(0, FixedIndexes.SetIterator)),
    decoded: new PreszrUnsupportedValue("Set Iterator")
});

test("unsupported - MapIterator", compare, {
    original: new Map()[Symbol.iterator](),
    encoded: preszr(encoded(0, FixedIndexes.MapIterator)),
    decoded: new PreszrUnsupportedValue("Map Iterator")
});

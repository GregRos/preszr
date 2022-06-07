import test from "ava";
import { encoded, items, preszr, testBuilder } from "../tools";
import { defaultPreszr } from "@lib/default";
import { FixedIndexes } from "@lib/encodings/fixed-indexes";

const setEncoding = testBuilder(defaultPreszr).getSimple();

test("empty", setEncoding, new Set(), preszr(encoded([], FixedIndexes.Set)));

test(
    "one item",
    setEncoding,
    new Set([1]),
    preszr(encoded([1], FixedIndexes.Set))
);

test(
    "two items",
    setEncoding,
    new Set([1, 2]),
    preszr(encoded([1, 2], FixedIndexes.Set))
);

test(
    "one ref item",
    setEncoding,
    new Set([{}]),
    preszr(encoded(["2"], FixedIndexes.Set), items({}))
);

test(
    "two ref items",
    setEncoding,
    new Set([{}, {}]),
    preszr(encoded(["2", "3"], FixedIndexes.Set), items({}, {}))
);

test(
    "nested set",
    setEncoding,
    new Set([new Set([1])]),
    preszr(encoded(["2"], FixedIndexes.Set), encoded([1], FixedIndexes.Set))
);

test(
    "string item",
    setEncoding,
    new Set(["a"]),
    preszr(encoded(["2"], FixedIndexes.Set), items("a"))
);
// Test unsupported
// Test complex refs

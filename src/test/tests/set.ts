import test from "ava";
import { encoded, items, preszr } from "../tools";
import { defaultPreszr } from "@lib/default";
import { Fixed } from "@lib/encodings/fixed";
import { symmetricTestUsingInner } from "../tools/macros-3";

const setEncoding = symmetricTestUsingInner(defaultPreszr).encodeDecodeDeepEqual();

test("empty", setEncoding, new Set(), preszr(encoded([], Fixed.Set)));

test("one item", setEncoding, new Set([1]), preszr(encoded([1], Fixed.Set)));

test(
    "two items",
    setEncoding,
    new Set([1, 2]),
    preszr(encoded([1, 2], Fixed.Set))
);

test(
    "one ref item",
    setEncoding,
    new Set([{}]),
    preszr(encoded(["2"], Fixed.Set), items({}))
);

test(
    "two ref items",
    setEncoding,
    new Set([{}, {}]),
    preszr(encoded(["2", "3"], Fixed.Set), items({}, {}))
);

test(
    "nested set",
    setEncoding,
    new Set([new Set([1])]),
    preszr(encoded(["2"], Fixed.Set), encoded([1], Fixed.Set))
);

test(
    "string item",
    setEncoding,
    new Set(["a"]),
    preszr(encoded(["2"], Fixed.Set), items("a"))
);
// Test unsupported
// Test complex refs

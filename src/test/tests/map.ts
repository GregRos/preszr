import test from "ava";
import { encoded, items, preszr } from "../tools";
import { defaultPreszr } from "@lib/default";
import { Fixed } from "@lib/encodings/fixed";
import { symmetricTestUsingInner } from "../tools/macros-3";

const mapEncoding = symmetricTestUsingInner(defaultPreszr)
    .title(({ title }) => `Map - ${title}`)
    .encodeDecodeDeepEqual();

test("empty", mapEncoding, new Map(), preszr(encoded([], Fixed.Map)));

test(
    "one pair",
    mapEncoding,
    new Map([[1, 2]]),
    preszr(encoded([[1, 2]], Fixed.Map))
);

test(
    "object key",
    mapEncoding,
    new Map([[{}, 1]]),
    preszr(encoded([["2", 1]], Fixed.Map), items({}))
);

test(
    "ref key-value",
    mapEncoding,
    new Map([[{}, {}]]),
    preszr(encoded([["2", "3"]], Fixed.Map), items({}, {}))
);

test(
    "two items",
    mapEncoding,
    new Map([
        [1, 2],
        [2, 3]
    ]),
    preszr(
        encoded(
            [
                [1, 2],
                [2, 3]
            ],
            Fixed.Map
        )
    )
);

test(
    "nested map",
    mapEncoding,
    new Map([[new Map(), 5]]),
    preszr(encoded([["2", 5]], Fixed.Map), encoded([], Fixed.Map))
);

test(
    "string key",
    mapEncoding,
    new Map([["a", 2]]),
    preszr(encoded([["2", 2]], Fixed.Map), items("a"))
);

// Test same ref, unsupported

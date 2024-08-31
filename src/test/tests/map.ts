import { defaultPreszr } from "@lib/default"
import { FixedIndexes } from "@lib/encodings/fixed-indexes"
import test from "ava"
import { encoded, items, preszr, testBuilder } from "../tools"

const mapEncoding = testBuilder(defaultPreszr)
    .title(({ title }) => `Map - ${title}`)
    .getSimple()

test("empty", mapEncoding, new Map(), preszr(encoded([], FixedIndexes.Map)))

test("one pair", mapEncoding, new Map([[1, 2]]), preszr(encoded([[1, 2]], FixedIndexes.Map)))

test(
    "object key",
    mapEncoding,
    new Map([[{}, 1]]),
    preszr(encoded([["2", 1]], FixedIndexes.Map), items({}))
)

test(
    "ref key-value",
    mapEncoding,
    new Map([[{}, {}]]),
    preszr(encoded([["2", "3"]], FixedIndexes.Map), items({}, {}))
)

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
            FixedIndexes.Map
        )
    )
)

test(
    "nested map",
    mapEncoding,
    new Map([[new Map(), 5]]),
    preszr(encoded([["2", 5]], FixedIndexes.Map), encoded([], FixedIndexes.Map))
)

test(
    "string key",
    mapEncoding,
    new Map([["a", 2]]),
    preszr(encoded([["2", 2]], FixedIndexes.Map), items("a"))
)

// Test same ref, unsupported

import { createSparseArray, stringify } from "../utils";
import test from "ava";

import { using, encoded, items, preszr } from "../tools";
import { defaultPreszr } from "@lib/default";
import { Fixed } from "@lib/encodings/fixed";

const singleton = using(defaultPreszr)
    .title(({ decoded, title }) => title ?? `array with ${stringify(decoded[0])} element`)
    .encodeDecodeDeepEqual();
{
    test(singleton, [1], preszr(items([1])));

    test(singleton, [true], preszr(items([true])));

    test(singleton, [null], preszr(items([null])));

    test(singleton, [Infinity], preszr(items(["Infinity"])));

    test(singleton, [-Infinity], preszr(items(["-Infinity"])));

    test(singleton, [-0], preszr(items(["-0"])));

    test(singleton, [NaN], preszr(items(["NaN"])));

    test(singleton, [4n], preszr(items(["B4"])));

    test(singleton, ["string"], preszr(items(["2"], "string")));

    test("Array [{}]", singleton, [{}], preszr(items(["2"], {})));

    test("Array [[]]", singleton, [[]], preszr(items(["2"], [])));
}

test("deepEqual assertions work for sparse arrays", t => {
    const sparse1 = createSparseArray({ 5: 1, 6: 1 });
    sparse1[5] = 1;
    sparse1[6] = 1;
    t.notDeepEqual(sparse1, [5, 6]);
    t.notDeepEqual(sparse1, createSparseArray({ 1: 1, 2: 1 }));
    t.deepEqual(sparse1, createSparseArray({ 5: 1, 6: 1 }));
});

{
    test(
        "sparse array",
        singleton,
        createSparseArray({ 1: 5, 2: 6 }),
        preszr(encoded({ 1: 5, 2: 6 }, Fixed.Array))
    );

    test(
        "sparse array with reference",
        singleton,
        createSparseArray({ 1: {}, 2: {} }),
        preszr(encoded({ 1: "2", 2: "3" }, Fixed.Array), items({}, {}))
    );

    test(
        "array with string keys",
        singleton,
        createSparseArray({ 1: 1, a: 2 }),
        preszr(encoded({ 1: 1, a: 2 }, Fixed.Array))
    );
}

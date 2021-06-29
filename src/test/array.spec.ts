import {combAttachMetadata, createSparseArray, stringify, testEncodeMacro} from "./utils";
import test from "ava";
import {
    infinityEncoding,
    nanEncoding,
    negInfinityEncoding,
    negZeroEncoding,
    undefinedEncoding
} from "../lib/szr-representation";
import {version} from "../lib/utils";
import {arrayEncoding} from "../lib/encodings/basic";

{
    const simpleArrayTest = combAttachMetadata(
        (x, input) => `array with ${stringify(input[0])} element`);

    test(simpleArrayTest, [1], [[1]]);
    test(simpleArrayTest, [true], [[true]]);
    test(simpleArrayTest, [null], [[null]]);
    test(simpleArrayTest, [Infinity], [[infinityEncoding]]);
    test(simpleArrayTest, [-Infinity], [[negInfinityEncoding]]);
    test(simpleArrayTest, [-0], [[negZeroEncoding]]);
    test(simpleArrayTest, [NaN], [[nanEncoding]]);
    test(simpleArrayTest, [undefined], [[undefinedEncoding]]);
    test(simpleArrayTest, [BigInt(4)], [["B4"]]);
    test(simpleArrayTest, ["string"], [["2"], "string"]);
    test("array [{}]", simpleArrayTest, [{}], [["2"], {}]);
    test("array [[]]", simpleArrayTest, [[]], [["2"], []]);
}

test("deepEqual assertions work for sparse arrays", t => {
    const sparse1 = createSparseArray({5: 1, 6: 1});
    sparse1[5] = 1;
    sparse1[6] = 1;
    t.notDeepEqual(sparse1, [5, 6]);
    t.notDeepEqual(sparse1, createSparseArray({1: 1, 2: 1}));
    t.deepEqual(sparse1, createSparseArray({5: 1, 6: 1}));
});

{
    const testSparseArrays = (t, decoded, encoded) => {
        encoded[0] = [version, encoded[0][0], {}];

        testEncodeMacro(t, decoded, encoded);
    };

    test("sparse array", testSparseArrays, createSparseArray({1: 5, 2: 6}), [
        [{1: arrayEncoding.key}],
        {1: 5, 2: 6}
    ]);

    test("sparse array with reference", testSparseArrays, createSparseArray({1: {}, 2: {}}), [
        [{1: arrayEncoding.key}],
        {1: "2", 2: "3"},
        {},
        {}
    ]);

    test("array with string keys", testSparseArrays, createSparseArray({1: 1, a: 2}), [
        [{1: arrayEncoding.key}],
        {1: 1, a: 2}
    ]);
}

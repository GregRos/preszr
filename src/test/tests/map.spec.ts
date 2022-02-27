import { encodeDecodeMacro, testDecodeMacro, testEncodeMacro } from "../utils";
import test from "ava";
import { getLibraryEncodingName } from "../../lib/utils";
import { decode } from "../../lib";
import { unsupportedEncodingKey } from "../../lib/encodings/basic";

const macro = encodeDecodeMacro({
    encode: testEncodeMacro,
    decode: testDecodeMacro
});

test("empty", macro, new Map(), [[{ 1: getLibraryEncodingName("Map") }, {}], []]);

test("one pair", macro, new Map([[1, 1]]), [[{ 1: getLibraryEncodingName("Map") }, {}], [[1, 1]]]);

test("ref key", macro, new Map([[{}, 1]]), [
    [{ 1: getLibraryEncodingName("Map") }, {}],
    [["2", 1]],
    {}
]);

test("ref key-value", macro, new Map([[{}, {}]]), [
    [{ 1: getLibraryEncodingName("Map") }, {}],
    [["2", "3"]],
    {},
    {}
]);
const o = {};
test(
    "same ref",
    encodeDecodeMacro({
        encode: testEncodeMacro,
        decode(t, decoded, encoded) {
            const rDecoded = decode<any>(encoded);
            for (const [key, value] of rDecoded) {
                t.is(key, value);
            }
        }
    }),
    new Map([[o, o]]),
    [[{ 1: getLibraryEncodingName("Map") }, {}], [["2", "2"]], {}]
);

test(
    "two items",
    macro,
    new Map([
        [1, 1],
        [2, 2]
    ]),
    [
        [{ 1: getLibraryEncodingName("Map") }, {}],
        [
            [1, 1],
            [2, 2]
        ]
    ]
);

test(
    "1 unsupported key",
    encodeDecodeMacro({
        encode: testEncodeMacro,
        decode(t, decoded, encoded) {
            const rDecoded = decode(encoded);
            t.deepEqual(rDecoded, new Map([[undefined, 1]]));
        }
    }),
    new Map([[() => {}, 1]]),
    [
        [{ 1: getLibraryEncodingName("Map"), 2: unsupportedEncodingKey }, { 2: "Function" }],
        [["2", 1]],
        0
    ]
);

test(
    "2 unsupported keys",
    encodeDecodeMacro({
        encode: testEncodeMacro,
        decode(t, decoded, encoded) {
            const rDecoded = decode(encoded);
            t.deepEqual(rDecoded, new Map([[undefined, 2]]));
        }
    }),
    new Map([
        [() => {}, 1],
        [() => {}, 2]
    ]),
    [
        [
            {
                1: getLibraryEncodingName("Map"),
                2: unsupportedEncodingKey,
                3: unsupportedEncodingKey
            },
            { 2: "Function", 3: "Function" }
        ],
        [
            ["2", 1],
            ["3", 2]
        ],
        0,
        0
    ]
);

test("nested map", macro, new Map([[new Map(), 5]]), [
    [{ 1: getLibraryEncodingName("Map"), 2: getLibraryEncodingName("Map") }, {}],
    [["2", 5]],
    []
]);

test("string key", macro, new Map([["a", 2]]), [
    [{ 1: getLibraryEncodingName("Map") }, {}],
    [["2", 2]],
    "a"
]);

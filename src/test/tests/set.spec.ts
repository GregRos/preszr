import { encodeDecodeMacro, testDecodeMacro, testEncodeMacro } from "../utils";
import test from "ava";
import { getLibraryEncodingName } from "../../lib/utils";
import { decode } from "../../lib";
import { unsupportedEncodingKey } from "../../lib/encodings/basic";

const macro = encodeDecodeMacro({
    encode: testEncodeMacro,
    decode: testDecodeMacro
});

test("empty", macro, new Set(), [[{ 1: getLibraryEncodingName("Set") }, {}], []]);

test("one item", macro, new Set([1]), [[{ 1: getLibraryEncodingName("Set") }, {}], [1]]);

test("one ref item", macro, new Set([{}]), [[{ 1: getLibraryEncodingName("Set") }, {}], ["2"], {}]);

test("set two items", macro, new Set([1, 2]), [
    [{ 1: getLibraryEncodingName("Set") }, {}],
    [1, 2]
]);

test(
    "1 unsupported set key",
    encodeDecodeMacro({
        encode: testEncodeMacro,
        decode(t, decoded, encoded) {
            const rDecoded = decode(encoded);
            t.deepEqual(rDecoded, new Set([undefined]));
        }
    }),
    new Set([() => {}]),
    [[{ 1: getLibraryEncodingName("Set"), 2: unsupportedEncodingKey }, { 2: "Function" }], ["2"], 0]
);

test(
    "2 unsupported set keys",
    encodeDecodeMacro({
        encode: testEncodeMacro,
        decode(t, decoded, encoded) {
            const rDecoded = decode(encoded);
            t.deepEqual(rDecoded, new Set([undefined]));
        }
    }),
    new Set([() => {}, () => {}]),
    [
        [
            {
                1: getLibraryEncodingName("Set"),
                2: unsupportedEncodingKey,
                3: unsupportedEncodingKey
            },
            { 2: "Function", 3: "Function" }
        ],
        ["2", "3"],
        0,
        0
    ]
);

test("nested set", macro, new Set([new Set([1])]), [
    [{ 1: getLibraryEncodingName("Set"), 2: getLibraryEncodingName("Set") }, {}],
    ["2"],
    [1]
]);

test("string item", macro, new Set(["a"]), [
    [{ 1: getLibraryEncodingName("Set") }, {}],
    ["2"],
    "a"
]);

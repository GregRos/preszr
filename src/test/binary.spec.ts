import test from "ava";
import {
    encodeDecodeMacro,
    testDecodeMacro,
    testEncodeMacro,
    toBase64,
} from "./utils";
import { getLibraryEncodingName } from "../lib/utils";
import { typedArrayCtors } from "../lib/encodings/binary";

const scalarMacros = encodeDecodeMacro({
    encode: testEncodeMacro,
    decode: testDecodeMacro,
});
function createArrayBuffer(...bytes: number[]) {
    const arr = new Uint8Array(bytes);
    return arr.buffer;
}

test("deepEqual works on binary types", (t) => {
    const array = createArrayBuffer(1, 2, 3, 4);
    const array2 = createArrayBuffer(1, 2, 3, 4);
    t.deepEqual(array, array2);
    const array3 = createArrayBuffer(2, 3, 4, 5);
    t.notDeepEqual(array, array3);
    const typed8 = new Uint8Array(array);
    t.notDeepEqual(typed8, array);
    const typed8b = new Uint8Array(array2);
    t.deepEqual(typed8, typed8b);
    const typed16 = new Uint16Array(array);
    t.notDeepEqual(typed16, typed8 as any);
});
const array1 = createArrayBuffer(1, 2, 3, 4, 5, 6, 7, 8);

test("ArrayBuffer", scalarMacros, array1, [
    [{ 1: getLibraryEncodingName("ArrayBuffer") }, {}],
    toBase64(array1),
]);

for (const ctor of typedArrayCtors) {
    test(ctor.name, scalarMacros, new ctor(array1), [
        [{ 1: getLibraryEncodingName(ctor.name) }, {}],
        toBase64(array1),
    ]);
}

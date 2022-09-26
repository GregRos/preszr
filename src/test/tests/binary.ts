import test from "ava";
import { getPrototypeName } from "@lib/utils";
import { encoded, preszr, testBuilder } from "../tools";
import { defaultPreszr } from "@lib/default";
import { createArrayBuffer, createSharedArrayBuffer } from "../utils";
import { FixedIndexes } from "@lib/encodings/fixed-indexes";

const binaryOutputDeepEqual = testBuilder(defaultPreszr)
    .title(({ original }) => `Binary Type ${getPrototypeName(original)}`)
    .getSimple();

test("deepEqual works on binary types", t => {
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
const arrayBuffer = createArrayBuffer(1, 2, 3, 4, 5, 6, 7, 8);
const base64 = "AQIDBAUGBwg=";
test(
    binaryOutputDeepEqual,
    arrayBuffer,
    preszr(encoded(base64, FixedIndexes.ArrayBuffer))
);

test(
    binaryOutputDeepEqual,
    createSharedArrayBuffer(1, 2, 3, 4, 5, 6, 7, 8),
    preszr(encoded(base64, FixedIndexes.SharedArrayBuffer))
);

test(
    binaryOutputDeepEqual,
    new Uint8Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Uint8Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Uint16Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Uint16Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Uint32Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Uint32Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Uint8ClampedArray(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Uint8ClampedArray)
    )
);

test(
    binaryOutputDeepEqual,
    new BigUint64Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.BigUint64Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Int8Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Int8Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Int16Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Int16Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Int32Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Int32Array)
    )
);

test(
    binaryOutputDeepEqual,
    new BigInt64Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.BigInt64Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Float32Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Float32Array)
    )
);

test(
    binaryOutputDeepEqual,
    new Float64Array(arrayBuffer),
    preszr(
        encoded(base64, FixedIndexes.ArrayBuffer),
        encoded("1", FixedIndexes.Float64Array)
    )
);

test(
    binaryOutputDeepEqual,
    new DataView(arrayBuffer),
    preszr(encoded(base64, FixedIndexes.DataView))
);

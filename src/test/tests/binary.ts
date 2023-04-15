import test from "ava";
import { getPrototypeName } from "@lib/utils";
import { encoded, preszr, preszrReturnAt, testBuilder } from "../tools";
import { defaultPreszr } from "@lib/default";
import { createArrayBuffer, createSharedArrayBuffer } from "../utils";
import { FixedIndexes } from "@lib/encodings/fixed-indexes";
import { decode, encode } from "@lib";
import { TypedArrayConstructor } from "@lib/encodings/binary";

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

function makeTypedArray(
    type: FixedIndexes,
    bufferRef: string,
    length: number,
    offset = 0
) {
    return encoded([bufferRef, offset, length], type);
}

test(
    binaryOutputDeepEqual,
    createSharedArrayBuffer(1, 2, 3, 4, 5, 6, 7, 8),
    preszr(encoded(base64, FixedIndexes.SharedArrayBuffer))
);

test(
    binaryOutputDeepEqual,
    new Uint8Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(FixedIndexes.Uint8Array, "1", arrayBuffer.byteLength)
    )
);

test(
    binaryOutputDeepEqual,
    new Uint16Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(
            FixedIndexes.Uint16Array,
            "1",
            arrayBuffer.byteLength / 2
        )
    )
);

test(
    binaryOutputDeepEqual,
    new Uint32Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(
            FixedIndexes.Uint32Array,
            "1",
            arrayBuffer.byteLength / 4
        )
    )
);

test(
    binaryOutputDeepEqual,
    new Uint8ClampedArray(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(
            FixedIndexes.Uint8ClampedArray,
            "1",
            arrayBuffer.byteLength
        )
    )
);

test(
    binaryOutputDeepEqual,
    new BigUint64Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(
            FixedIndexes.BigUint64Array,
            "1",
            arrayBuffer.byteLength / 8
        )
    )
);

test(
    binaryOutputDeepEqual,
    new Int8Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(FixedIndexes.Int8Array, "1", arrayBuffer.byteLength)
    )
);

test(
    binaryOutputDeepEqual,
    new Int16Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(FixedIndexes.Int16Array, "1", arrayBuffer.byteLength / 2)
    )
);

test(
    binaryOutputDeepEqual,
    new Int32Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(FixedIndexes.Int32Array, "1", arrayBuffer.byteLength / 4)
    )
);

test(
    binaryOutputDeepEqual,
    new BigInt64Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(
            FixedIndexes.BigInt64Array,
            "1",
            arrayBuffer.byteLength / 8
        )
    )
);

test(
    binaryOutputDeepEqual,
    new Float32Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(
            FixedIndexes.Float32Array,
            "1",
            arrayBuffer.byteLength / 4
        )
    )
);

test(
    binaryOutputDeepEqual,
    new Float64Array(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(
            FixedIndexes.Float64Array,
            "1",
            arrayBuffer.byteLength / 8
        )
    )
);

test(
    binaryOutputDeepEqual,
    new DataView(arrayBuffer),
    preszrReturnAt(
        2,
        encoded(base64, FixedIndexes.ArrayBuffer),
        makeTypedArray(FixedIndexes.DataView, "1", arrayBuffer.byteLength)
    )
);

{
    const commonData = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array(commonData.buffer, 1);

    test("arrays with common buffer", t => {
        const msg = {
            a: commonData,
            b: b
        };
        const recoded = decode(encode(msg)) as typeof msg;
        t.is(recoded.a.buffer, recoded.b.buffer);
    });
}

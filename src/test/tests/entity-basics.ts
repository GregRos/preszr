import test from "ava";
import { decode, encode } from "@lib";
import { version as pkgVersion } from "../../lib/utils";

test("encoding - entity is array", t => {
    t.true(Array.isArray(encode({})));
});

test("decoding - header structure", t => {
    const [header] = encode({}) as any[];
    const [version, encodingKeys, encodingSpec, metadata] = header;
    t.is(version, pkgVersion);
    t.deepEqual(encodingKeys, []);
    t.deepEqual(encodingSpec, {});
    t.deepEqual(metadata, {});
});

test("decoding - error when trying to decode anomalous object", t => {
    const badPayloads = [
        {}, // non-array
        [], // no header
        [1], // invalid header
        [[]], // no version
        [[pkgVersion, [], {}, {}, 1]], // no data
        [["g", {}, {}], 1], // non-numeric version
        [[1, {}, {}], 1], // non-string version
        [[pkgVersion], 1], // no encoding info
        [[pkgVersion, {}], 1], // no metadata,
        [[pkgVersion, [], {}, {}], 1] // no root reference
    ] as any[];

    for (const payload of badPayloads) {
        t.throws(() => decode(payload));
    }
});

test("decoding - error when trying to decode wrong version", t => {
    const encoded = [[pkgVersion + 1, [], {}, {}, 1], {}] as any;
    t.throws(() => decode(encoded), {
        code: "decode/input/version/mismatch"
    });
});

test("decoding error - unknown encoding", t => {
    const encoded = [[pkgVersion, ["test.v0"], { 1: 0 }, {}, 1], 0] as any;
    t.throws(() => decode(encoded), {
        code: "decode/keys/unknown-proto"
    });
});

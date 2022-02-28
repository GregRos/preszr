import test from "ava";
import { decode, encode } from "../../lib";
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

function isBadPayloadError(err: Error) {
    return err.message.includes("not preszr-encoded");
}

function isBadVersionError(err: Error) {
    return err.message.includes("version");
}

test("decoding - error when trying to decode anomalous object", t => {
    const badPayloads = [
        {}, // non-array
        [], // no header
        [1], // invalid header
        [[]], // no version
        [[pkgVersion, [], {}, {}]], // no data
        [["g", {}, {}], 1], // non-numeric version
        [[1, {}, {}], 1], // non-string version
        [[pkgVersion], 1], // no encoding info
        [[pkgVersion, {}], 1] // no metadata,
    ] as any[];

    for (const payload of badPayloads) {
        const err = t.throws(() => decode(payload));
        t.true(isBadPayloadError(err));
    }
});

test("decoding - error when trying to decode wrong version", t => {
    const encoded = [[pkgVersion + 1, [], {}, {}], {}] as any;
    const err = t.throws(() => decode(encoded));
    t.true(isBadVersionError(err));
});

test("decoding error - unknown encoding", t => {
    const encoded = [[pkgVersion, ["test.v0"], { 1: 0 }, {}], 0] as any;
    const err = t.throws(() => decode(encoded));
    t.regex(err.message, /not found/);
});

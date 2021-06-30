import test from "ava";
import {decode, encode} from "../lib";
import {version as pkgVersion, version} from "../lib/utils";

test("encoding - entity is array", t => {
    t.true(Array.isArray(encode({})));
});

test("decoding - first element is header", t => {
    const [header, ...rest] = encode({}) as any[];
    const [version, types, custom] = header;
    t.is(version, pkgVersion);
    t.deepEqual(types, {});
    t.deepEqual(custom, {});
});

function isBadPayloadError(err: Error) {
    return err.message.includes("not szr-encoded");
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
        [[pkgVersion, {}, {}]], // no data
        [["g", {}, {}], 1], // non-numeric version
        [[1, {}, {}], 1], // non-string version
        [["1"], 1], // no encoding info
        [["1", {}], 1] // no metadata,
    ] as any[];

    for (const payload of badPayloads) {
        const err = t.throws(() => decode(payload));
        t.true(isBadPayloadError(err));
    }

    let err = t.throws(() => decode({}));
    t.true(isBadPayloadError(err));
    err = t.throws(() => decode([]));
    t.true(isBadPayloadError(err));
    err = t.throws(() => decode([1]));
    t.true(isBadPayloadError(err));
    err = t.throws(() => decode([pkgVersion, {}, {}]));
    t.true(isBadPayloadError(err));
    const nonNumericVersion = [["g", {}, {}], 1];
    err = t.throws(() => decode(nonNumericVersion));
    const nonStringVersion = [[1, {}, {}], 1];
    err = t.throws(() => decode(nonStringVersion));
    const noEncodingData = [["1"], 1];
    err = t.throws(() => decode(noEncodingData));
});

test("decoding - error when trying to decode wrong version", t => {
    const encoded = [[pkgVersion + 1, {}, {}], {}];
    const err = t.throws(() => decode(encoded));
    t.true(isBadVersionError(err));
});

test("decoding error - unknown encoding", t => {
    const encoded = [[pkgVersion, {1: "test"}, {}], 0];
    const err = t.throws(() => decode(encoded));
    t.regex(err.message, /not found/);
});

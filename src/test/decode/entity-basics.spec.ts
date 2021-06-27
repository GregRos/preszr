import test from "ava";
import {decode, encode} from "../../lib";
import {version as pkgVersion, version} from "../../lib/utils";

function isBadPayloadError(err: Error) {
    return err.message.includes("not szr-encoded");
}

function isBadVersionError(err: Error) {
    return err.message.includes("version");
}

test("error when trying to decode anomalous object", t => {
    let err = t.throws(() => decode({}));
    t.true(isBadPayloadError(err));
    err = t.throws(() => decode([]));
    t.true(isBadPayloadError(err));
    err = t.throws(() => decode([1]));
    t.true(isBadPayloadError(err));
    err = t.throws(() => decode([pkgVersion, {}, {}]));
    t.true(isBadPayloadError(err));
});

test("error when trying to decode wrong version", t => {
    const encoded = [[pkgVersion + 1, {}, {}], {}];
    const err = t.throws(() => decode(encoded));
    t.true(isBadVersionError(err));
});

test("first element is metadata", t => {
    const [metadata, ...rest] = encode({}) as any[];
    const [version, types, custom] = metadata;
    t.is(version, pkgVersion);
    t.deepEqual(types, {});
    t.deepEqual(custom, {});
});

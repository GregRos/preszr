import test from "ava";
import {encode} from "../../lib";
import {version as pkgVersion, version} from "../../lib/utils";

test("entity is array", t => {
    t.true(Array.isArray(encode({})));
});

test("first element is metadata", t => {
    const [metadata, ...rest] = encode({}) as any[];
    const [version, types, custom] = metadata;
    t.is(version, pkgVersion);
    t.deepEqual(types, {});
    t.deepEqual(custom, {});
});

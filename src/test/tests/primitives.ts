import test from "ava";
import { stringify } from "../utils";
import { using } from "../tools";
import { defaultPreszr } from "@lib/default";

const primtiveTests = using(defaultPreszr)
    .title(({ decoded, title }) => title ?? `Primitive - ${stringify(decoded)}`)
    .encodeDecodeDeepEqual();

test.failing("check test fails on mismatch", primtiveTests, 1, 2);

test(primtiveTests, true, true);
test(primtiveTests, null, null);
test(primtiveTests, Infinity, "Infinity");
test(primtiveTests, -Infinity, "-Infinity");
test(primtiveTests, -0, "-0");
test(primtiveTests, NaN, "NaN");
test(primtiveTests, undefined, "-");
test("bigint", primtiveTests, 4n, "B4");

import test from "ava";
import { stringify } from "../utils";
import { defaultPreszr } from "@lib/default";
import { symmetricTestUsingInner } from "../tools/macros-3";

const primtiveTests = symmetricTestUsingInner(defaultPreszr)
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

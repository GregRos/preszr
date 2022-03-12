import test from "ava";
import { stringify } from "../utils";
import { defaultPreszr } from "@lib/default";
import { testBuilder } from "../tools";

const primtiveTests = testBuilder(defaultPreszr)
    .title(
        ({ original, title }) => title ?? `Primitive - ${stringify(original)}`
    )
    .getSimple();

test.failing("check test fails on mismatch", primtiveTests, 1, 2);

test(primtiveTests, true, true);
test(primtiveTests, null, null);
test(primtiveTests, Infinity, "Infinity");
test(primtiveTests, -Infinity, "-Infinity");
test(primtiveTests, -0, "-0");
test(primtiveTests, NaN, "NaN");
test(primtiveTests, undefined, "-");
test("bigint", primtiveTests, 4n, "B4");

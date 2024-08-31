import { defaultPreszr } from "@lib/default"
import test from "ava"
import { testBuilder } from "../tools"
import { stringify } from "../utils"

const primtiveTests = testBuilder(defaultPreszr)
    .title(({ original, title }) => title ?? `Primitive - ${stringify(original)}`)
    .getSimple()

test(primtiveTests, true, true)
test(primtiveTests, null, null)
test(primtiveTests, Infinity, "Infinity")
test(primtiveTests, -Infinity, "-Infinity")
test(primtiveTests, -0, "-0")
test(primtiveTests, NaN, "NaN")
test(primtiveTests, undefined, "-")
test("bigint", primtiveTests, 4n, "B4")

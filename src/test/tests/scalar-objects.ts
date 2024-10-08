/* eslint-disable no-new-wrappers */
/* tslint:disable:no-construct */
// noinspection JSPrimitiveTypeWrapperUsage

import { defaultPreszr } from "@lib/default"
import { FixedIndexes } from "@lib/encodings/fixed-indexes"
import test from "ava"
import { encoded, preszr, testBuilder } from "../tools"

const scalarEncodings = testBuilder(defaultPreszr).getSimple()

test("deepEqual works on object primitives", t => {
    t.deepEqual(new Number(5), new Number(5))
    t.notDeepEqual(5, new Number(5))
    t.deepEqual(new Boolean(true), new Boolean(true))
    t.notDeepEqual(new Boolean(true), true)
    t.deepEqual(new String(""), new String(""))
    t.notDeepEqual(new String(""), "")
})

test("deepEqual works on dates", t => {
    const now = Date.now()
    t.deepEqual(new Date(now), new Date(now))
    t.notDeepEqual(new Date(now), new Date(now - 1))
})

test("deepEqual works on regex", t => {
    const regex = /abc/
    t.deepEqual(regex, /abc/)
    t.notDeepEqual(regex, /abcd/)
    t.notDeepEqual(regex, /abc/i)
    t.notDeepEqual(regex, "abc" as any)
})

test("Number wrapper", scalarEncodings, new Number(5), preszr(encoded(5, FixedIndexes.FundNumber)))

test(
    "Boolean wrapper",
    scalarEncodings,
    new Boolean(5),
    preszr(encoded(true, FixedIndexes.FundBool))
)

test(
    "String wrapper",
    scalarEncodings,
    new String("x"),
    preszr(encoded("x", FixedIndexes.FundString))
)

const date = new Date()

test("Date", scalarEncodings, date, preszr(encoded(date.getTime(), FixedIndexes.Date)))

test("RegExp no flags", scalarEncodings, /abc/, preszr(encoded("abc", FixedIndexes.RegExp)))

test(
    "RegExp with flags",
    scalarEncodings,
    /abc/gi,
    preszr(encoded(["abc", "gi"], FixedIndexes.RegExp))
)

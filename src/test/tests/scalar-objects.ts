/* eslint-disable no-new-wrappers */
/* tslint:disable:no-construct */
// noinspection JSPrimitiveTypeWrapperUsage

import test from "ava";
import { encoded, preszr } from "../tools";
import { defaultPreszr } from "@lib/default";
import { Fixed } from "@lib/encodings/fixed";
import { symmetricTestUsingInner } from "../tools/macros-3";

const scalarEncodings = symmetricTestUsingInner(defaultPreszr).encodeDecodeDeepEqual();

test("deepEqual works on object primitives", t => {
    t.deepEqual(new Number(5), new Number(5));
    t.notDeepEqual(5, new Number(5));
    t.deepEqual(new Boolean(true), new Boolean(true));
    t.notDeepEqual(new Boolean(true), true);
    t.deepEqual(new String(""), new String(""));
    t.notDeepEqual(new String(""), "");
});

test("deepEqual works on dates", t => {
    const now = Date.now();
    t.deepEqual(new Date(now), new Date(now));
    t.notDeepEqual(new Date(now), new Date(now - 1));
});

test("deepEqual works on regex", t => {
    const regex = /abc/;
    t.deepEqual(regex, /abc/);
    t.notDeepEqual(regex, /abcd/);
    t.notDeepEqual(regex, /abc/i);
    t.notDeepEqual(regex, "abc" as any);
});

test(
    "Number wrapper",
    scalarEncodings,
    new Number(5),
    preszr(encoded(5, Fixed.FundNumber))
);

test(
    "Boolean wrapper",
    scalarEncodings,
    new Boolean(5),
    preszr(encoded(true, Fixed.FundBool))
);

test(
    "String wrapper",
    scalarEncodings,
    new String("x"),
    preszr(encoded("x", Fixed.FundString))
);

const date = new Date();

test(
    "Date",
    scalarEncodings,
    date,
    preszr(encoded(date.getTime(), Fixed.Date))
);

test(
    "RegExp no flags",
    scalarEncodings,
    /abc/,
    preszr(encoded("abc", Fixed.RegExp))
);

test(
    "RegExp with flags",
    scalarEncodings,
    /abc/gi,
    preszr(encoded(["abc", "gi"], Fixed.RegExp))
);

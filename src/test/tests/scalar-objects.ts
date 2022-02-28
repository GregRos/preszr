/* eslint-disable no-new-wrappers */
/* tslint:disable:no-construct */
// noinspection JSPrimitiveTypeWrapperUsage

import test from "ava";
import { encodeDecodeMacro, testDecodeMacro, testEncodeMacro } from "../utils";
import { getBuiltInEncodingName } from "../../lib/utils";

const scalarMacros = encodeDecodeMacro({
    encode: testEncodeMacro,
    decode: testDecodeMacro
});

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

test("Number wrapper", scalarMacros, new Number(5), [
    [{ 1: getBuiltInEncodingName("Number") }, {}],
    5
]);

test("Boolean wrapper", scalarMacros, new Boolean(true), [
    [{ 1: getBuiltInEncodingName("Boolean") }, {}],
    true
]);

test("String wrapper", scalarMacros, new String("a"), [
    [{ 1: getBuiltInEncodingName("String") }, {}],
    "a"
]);

const date = new Date();

test("Date", scalarMacros, new Date(), [
    [{ 1: getBuiltInEncodingName("Date") }, {}],
    date.getTime()
]);

test("regexp no flags", scalarMacros, /abc/, [
    [{ 1: getBuiltInEncodingName("RegExp") }, {}],
    "abc"
]);

test("regexp with flags", scalarMacros, /abc/gi, [
    [{ 1: getBuiltInEncodingName("RegExp") }, {}],
    ["abc", "gi"]
]);

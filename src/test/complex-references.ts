import test from "ava";
import {decode, encode} from "../lib";
import {szrDefaultHeader} from "./utils";

test("object references same object twice", t => {
    const o = {};
    const b = {o1: o, o2: o};
    const encoded = encode(b);
    t.deepEqual(encoded, szrDefaultHeader({o1: "2", o2: "2"}, {}));
    const B = decode<any>(encoded);
    t.deepEqual(B, b);
    t.is(B.o1, B.o2);
});

test("one object, circular reference", t => {
    const a = {} as any;
    a.a = a;
    const encoded = encode(a);
    t.deepEqual(encoded, szrDefaultHeader({a: "1"}));
    const decoded = decode<any>(encoded);
    t.is(decoded.a, decoded);
});

test("one array, circular reference", t => {
    const a = [] as any;
    a.push(a);
    const encoded = encode(a);
    t.deepEqual(encoded, szrDefaultHeader(["1"]));
    const decoded = decode<any>(encoded);
    t.is(decoded[0], decoded);
});

test("two objects, circular references", t => {
    const a = {} as any;
    const b = {} as any;
    a.b = b;
    b.a = a;
    const encoded = encode(a);
    t.deepEqual(encoded, szrDefaultHeader({b: "2"}, {a: "1"}));
    const decoded = decode(encoded);
    t.deepEqual(decoded, a);
    t.is(a.b, b);
    t.is(b.a, a);
});

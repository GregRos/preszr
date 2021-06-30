import test from "ava";
import {decode, encode, Szr} from "../lib";

test("simple object", t => {
    const obj2 = {};
    const obj = {
        boolean: true,
        number: 1,
        nonJsonNumber: Infinity,
        string: "hello",
        null: null,
        map: new Map([[
            1, 1
        ]]),
        set: new Set([5]),
        array: [1],
        date: new Date(),
        regexp: /abc/gi,
        ref1: obj2,
        ref2: obj2
    };

    const decoded = decode(
        JSON.parse(JSON.stringify(encode(obj)))
    );
    t.deepEqual(decoded, obj);
    t.is(decoded.ref1, decoded.ref2);
});

test("circular references", t => {
    const obj = {
        circular: null as any
    };
    obj.circular = obj;
    const decoded = decode(
        JSON.parse(JSON.stringify(encode(obj)))
    );
    t.is(decoded, decoded.circular);
});

test("custom class", t => {
    class MyCustomClass {
        myMethod() {
            return 10;
        }
    }
    const szr = new Szr({
        encodings: [MyCustomClass]
    });
    const instance = new MyCustomClass();
    const decoded = szr.decode(
        JSON.parse(JSON.stringify(szr.encode(instance)))
    );
    t.deepEqual(decoded, instance);
    t.is(instance.myMethod(), 10);
});

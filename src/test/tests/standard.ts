import test from "ava";
import { decode, encode, Preszr } from "@lib";

test("simple object", t => {
    const obj2 = {};
    const obj = {
        boolean: true,
        number: 1,
        nonJsonNumber: Infinity,
        string: "hello",
        alsoString: "hello",
        undefined,
        null: null,
        bigint: BigInt("1000000000000000000000000"),
        binary: new Uint8Array([1, 2, 3, 4]),
        error: new Error(),
        nullProtoObject: Object.create(null, {
            value: {
                value: 5,
                enumerable: true
            }
        }),
        map: new Map([[1, 1]]),
        set: new Set([5]),
        array: [1],
        date: new Date(),
        regexp: /abc/gi,
        ref1: obj2,
        ref2: obj2
    };

    const decoded = decode<any>(JSON.parse(JSON.stringify(encode(obj))));
    t.deepEqual(decoded, obj);
    t.is(decoded.ref1, decoded.ref2);
});

test("circular references", t => {
    const obj = {
        circular: null as any
    };
    obj.circular = obj;
    const decoded = decode<any>(JSON.parse(JSON.stringify(encode(obj))));
    t.is(decoded, decoded.circular);
});

test("custom class", t => {
    class MyCustomClass {
        myMethod() {
            return 10;
        }
    }
    const preszr = Preszr({
        encodings: [MyCustomClass]
    });
    const instance = new MyCustomClass();
    const decoded = preszr.decode(
        JSON.parse(JSON.stringify(preszr.encode(instance)))
    );
    t.deepEqual(decoded, instance);
    t.is(instance.myMethod(), 10);
});

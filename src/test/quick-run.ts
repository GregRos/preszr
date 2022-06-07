import { encode, Preszr } from "../lib";

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

class ExampleVersionedClass {}

const preszr = Preszr([
    {
        name: "example",
        version: 1,
        encodes: ExampleVersionedClass
    },
    {
        name: "example",
        version: 2,
        encodes: ExampleVersionedClass
    }
]);
console.log(JSON.stringify(encode(obj), null, 2));

let a: any;

const b = typeof a;

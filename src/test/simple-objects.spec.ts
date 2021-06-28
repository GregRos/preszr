import test, {ExecutionContext, Macro} from "ava";
import {version} from "../lib/utils";
import {decode, encode} from "../lib";
import {
    infinityEncoding,
    nanEncoding,
    negInfinityEncoding,
    negZeroEncoding, SzrCustomMetadata,
    SzrEncodingInformation,
    SzrMetadata,
    SzrOutput,
    SzrRepresentation,
    undefinedEncoding
} from "../lib/szr-representation";
import {getSparseArray, stringify} from "./utils";
import {arrayEncoding} from "../lib/encodings/basic";

const emptyMetadata = [version, {}, {}] as SzrMetadata;

function createSzrRep([encodings, meta], ...arr): SzrRepresentation {
    const metadata = [version, encodings, meta] as SzrMetadata;
    return [metadata, ...arr];
}

function createDefaultSzrRep(...arr): SzrRepresentation {
    return createSzrRep([{}, {}], ...arr);
}


export const getMacro = titleFunc => {
    const simpleObjTests: Macro<any> = (
        t: ExecutionContext,
        decoded: any,
        encoded: any,
        hasMetadata = false) => {

        const encodedWithMetadata = hasMetadata ? createSzrRep(encoded[0] as any, ...encoded.slice(1)) : createDefaultSzrRep(...encoded);
        const rDecoded = decode(encodedWithMetadata);
        t.deepEqual(rDecoded, decoded);
        const [m, ...rest] = encode(decoded) as any;
        t.deepEqual(rest, encoded);
    };
    simpleObjTests.title = titleFunc;
    return simpleObjTests;
};
const simpleObjectTest = getMacro((x, input) => x ?? `object with ${stringify(input.value)} property`)

test(simpleObjectTest, {value: 1}, [{value: 1}]);
test(simpleObjectTest, {value: true}, [{value: true}]);
test(simpleObjectTest, {value: null}, [{value: null}]);
test(simpleObjectTest, {value: Infinity}, [{value: infinityEncoding}]);
test(simpleObjectTest, {value: -Infinity}, [{value: negInfinityEncoding}]);
test(simpleObjectTest, {value: -0}, [{value: negZeroEncoding}]);
test(simpleObjectTest, {value: NaN}, [{value: nanEncoding}]);
test(simpleObjectTest, {value: undefined}, [{value: undefinedEncoding}]);
test(simpleObjectTest, {value: BigInt(4)}, [{value: "B4"}]);
test(simpleObjectTest, {value: "string"}, [{value: "2"}, "string"]);
test(simpleObjectTest, {value: []}, [{value: "2"}, []]);
test("string", simpleObjectTest, "abc", ["abc"]);
test("empty array", simpleObjectTest, [], [[]]);

const simpleArrayTest = getMacro((x, input) => x ?? `array with ${stringify(input[0])} element`);

test(simpleArrayTest, [1], [[1]]);
test(simpleArrayTest, [true], [[true]]);
test(simpleArrayTest, [null], [[null]]);
test(simpleArrayTest, [Infinity], [[infinityEncoding]]);
test(simpleArrayTest, [-Infinity], [[negInfinityEncoding]]);
test(simpleArrayTest, [-0], [[negZeroEncoding]]);
test(simpleArrayTest, [NaN], [[nanEncoding]]);
test(simpleArrayTest, [undefined], [[undefinedEncoding]]);
test(simpleArrayTest, [BigInt(4)], [["B4"]]);
test(simpleArrayTest, ["string"], [["2"], "string"]);

test("sparse array", simpleArrayTest, getSparseArray({2: 1, 5: 1}), [{2: 1, 5: 1}], {1: arrayEncoding.key}, {1: true});

test("array [{}]", simpleArrayTest, [{}], [["2"], {}]);
test("array [[]]", simpleArrayTest, [[]], [["2"], []]);
const simpleRefTest = getMacro(x => x);

test("object references object", simpleRefTest, {a: {}}, [{a: "2"}, {}]);
test("object references two objects", simpleRefTest, {a: {}, b: {}}, [{a: "2", b: "3"}, {}, {}]);
test("object references same object twice", t => {
    const o = {};
    const b = {o1: o, o2: o};
    const encoded = encode(b) as any[];
    t.deepEqual(encoded, createDefaultSzrRep({o1: "2", o2: "2"}, {}));
    const B = decode(encoded);
    t.deepEqual(B, b);
    t.is(B.o1, B.o2);
});

test("one object, circular reference", t => {
    const a = {} as any;
    a.a = a;
    const encoded = encode(a);
    t.deepEqual(encoded, createDefaultSzrRep({a: "1"}));
    const decoded = decode(encoded);
    t.is(decoded.a, decoded);
});

test("one array, circular reference", t => {
    const a = [] as any;
    a.push(a);
    const encoded = encode(a);
    t.deepEqual(encoded, createDefaultSzrRep(["1"]));
    const decoded = decode(encoded);
    t.is(decoded[0], decoded);
});

test("two objects, circular references", t => {
    const a = {} as any;
    const b = {} as any;
    a.b = b;
    b.a = a;
    const encoded = encode(a);
    t.deepEqual(encoded, createDefaultSzrRep({b: "2"}, {a: "1"}));
    const decoded = decode(encoded);
    t.deepEqual(decoded, a);
    t.is(a.b, b);
    t.is(b.a, a);
});


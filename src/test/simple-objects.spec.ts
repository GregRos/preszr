import test, {ExecutionContext, Macro} from "ava";
import {version} from "../lib/utils";
import {decode, encode} from "../lib";
import {
    infinityEncoding, nanEncoding, negInfinityEncoding, negZeroEncoding,
    SzrMetadata, SzrOutput,
    SzrRepresentation, undefinedEncoding
} from "../lib/szr-representation";
import {stringify} from "./helpers";

const emptyMetadata = [version, {}, {}] as SzrMetadata;

function attachMetadata(...arr): SzrRepresentation {
    return [emptyMetadata, ...arr];
}

const getMacro = titleFunc => {
    const simpleObjTests: Macro<any> = (t: ExecutionContext, decoded: any, encoded: SzrRepresentation) => {
        encoded = attachMetadata(...encoded);
        const rDecoded = decode(encoded);
        t.deepEqual(rDecoded, decoded);
        const rEncoded = encode(decoded);
        t.deepEqual(rEncoded, encoded);
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

const simpleRefTest = getMacro(x => x);

test("object references object", simpleRefTest, {a: {}}, [{a: "2"}, {}]);
test("object references two objects", simpleRefTest, {a: {}, b: {}}, [{a: "2", b: "3"}, {}, {}]);
test("object references same object twice", t => {
    const o = {};
    const b = {o1: o, o2: o};
    const encoded = encode(b) as any[];
    t.deepEqual(encoded, attachMetadata({o1: "2", o2: "2"}, {}));
    const B = decode(encoded);
    t.deepEqual(B, b);
    t.is(B.o1, B.o2);
});

test("two objects, circular references", t => {
    const a = {} as any;
    const b = {} as any;
    a.b = b;
    b.a = a;
    const encoded = encode(a);
    t.deepEqual(encoded, attachMetadata({b: "2"}, {a: "1"}));
    const decoded = decode(encoded);
    t.deepEqual(decoded, a);
    t.is(a.b, b);
    t.is(b.a, a);
});


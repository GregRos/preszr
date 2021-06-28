import test, {ExecutionContext, Macro} from "ava";
import {version} from "../lib/utils";
import {decode, encode} from "../lib";
import {
    infinityEncoding,
    nanEncoding,
    negInfinityEncoding,
    negZeroEncoding,
    SzrMetadata,
    undefinedEncoding
} from "../lib/szr-representation";
import {
    createSparseArray,
    createSzrRep, createWithTitle,
    stringify,
    szrDefaultMetadata
} from "./utils";
import {arrayEncoding} from "../lib/encodings/basic";

const emptyMetadata = [version, {}, {}] as SzrMetadata;

const testEncodeMacro: any = (t: ExecutionContext, decoded: any, encoded: any) => {
    const rEncoded = encode(decoded) as any;
    t.deepEqual(rEncoded, encoded);
};

const testDecodeMacro: any = (t: ExecutionContext, decoded: any, encoded: any) => {
    const rDecoded = decode(encoded);
    t.deepEqual(rDecoded, decoded);
};

testDecodeMacro.label = "decode";

{
    const combAttachMetadata = titleFunc => {
        const attachMetadata = (t, decoded, encoded) => [t, decoded, szrDefaultMetadata(...encoded)];
        return [
            createWithTitle(
                testEncodeMacro,
                attachMetadata,
                (title, ...args) => `encode:: ${title ?? titleFunc(...args)}`
            ),
            createWithTitle(
                testDecodeMacro,
                attachMetadata,
                (title, ...args) => `decode:: ${title ?? titleFunc(...args)}`
            )
        ] as [Macro<any>, Macro<any>];
    };
    {
        const simpleObjectTest = combAttachMetadata(input => `{value: ${stringify(input.value)}}`);

        test(simpleObjectTest, {value: 1}, [{value: 1}]);
        test(simpleObjectTest, {value: true}, [{value: true}]);
        test(simpleObjectTest, {value: null}, [{value: null}]);
        test(simpleObjectTest, {value: Infinity}, [{value: infinityEncoding}]);
        test(simpleObjectTest, {value: -Infinity},
            [{value: negInfinityEncoding}]
        );
        test(simpleObjectTest, {value: -0}, [{value: negZeroEncoding}]);
        test(simpleObjectTest, {value: NaN}, [{value: nanEncoding}]);
        test(simpleObjectTest, {value: undefined},
            [{value: undefinedEncoding}]
        );
        test(simpleObjectTest, {value: BigInt(4)}, [{value: "B4"}]);
        test(simpleObjectTest, {value: "string"}, [{value: "2"}, "string"]);
        test(simpleObjectTest, {value: []}, [{value: "2"}, []]);
        test("string", simpleObjectTest, "abc", ["abc"]);
        test("object references object", simpleObjectTest, {a: {}},
            [{a: "2"}, {}]
        );
        test("object references two objects", simpleObjectTest, {a: {}, b: {}},
            [{a: "2", b: "3"}, {}, {}]
        );

        test("test unsupported properties", t => {
           const encodedFunction = encode({a() {}});
           t.deepEqual(encodedFunction, szrDefaultMetadata({a: null}));
           const encodedWeakMap = encode({a: new WeakMap()});
           t.deepEqual(encodedWeakMap, szrDefaultMetadata({a: null}));
           const encodedWeakSet = encode({a: new WeakSet()});
           t.deepEqual(encodedWeakSet, szrDefaultMetadata({a: null}));
        });
    }

    {
        const simpleArrayTest = combAttachMetadata(
            (x, input) => `array with ${stringify(input[0])} element`);

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
        test("array [{}]", simpleArrayTest, [{}], [["2"], {}]);
        test("array [[]]", simpleArrayTest, [[]], [["2"], []]);
    }
}
test("deepEqual assertions work for sparse arrays", t => {
    const sparse1 = createSparseArray({5: 1, 6: 1});
    sparse1[5] = 1;
    sparse1[6] = 1;
    t.notDeepEqual(sparse1, [5, 6]);
    t.notDeepEqual(sparse1, createSparseArray({1: 1, 2: 1}));
    t.deepEqual(sparse1, createSparseArray({5: 1, 6: 1}));
});

{
    const testSparseArrays = (t, decoded, encoded) => {
        encoded[0] = [version, encoded[0][0], {}];

        testEncodeMacro(t, decoded, encoded);
    };

    test("sparse array", testSparseArrays, createSparseArray({1: 5, 2: 6}), [
        [{1: arrayEncoding.key}],
        {1: 5, 2: 6}
    ]);

    test("sparse array with reference", testSparseArrays, createSparseArray({1: {}, 2: {}}), [
        [{1: arrayEncoding.key}],
        {1: "2", 2: "3"},
        {},
        {}
    ]);

    test("array with string keys", testSparseArrays, createSparseArray({1: 1, a: 2}), [
        [{1: arrayEncoding.key}],
        {1: 1, a: 2}
    ]);


}


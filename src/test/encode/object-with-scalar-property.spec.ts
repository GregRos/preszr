import test, {Macro} from "ava";
import {version} from "../../lib/utils";
import {encode} from "../../lib";
import {
    infinityEncoding, nanEncoding, negInfinityEncoding, negZeroEncoding,
    SzrMetadata,
    SzrRepresentation, undefinedEncoding
} from "../../lib/szr-representation";

const emptyMetadata = [version, {}, {}] as SzrMetadata;

function attachMetadata(...arr): SzrRepresentation {
    return [emptyMetadata, ...arr];
}

const simpleObjectTest: Macro<any> =      (t, input, expected) => {
    t.deepEqual(encode(input), attachMetadata(expected));
};

simpleObjectTest.title = (x, input) => x ?? `object with ${input.value} property`

test(simpleObjectTest, {value: 1}, {value: 1});
test(simpleObjectTest, {value: true}, {value: true});
test(simpleObjectTest, {value: null}, {value: null});
test(simpleObjectTest, {value: Infinity}, {value: infinityEncoding});
test(simpleObjectTest, {value: -Infinity}, {value: negInfinityEncoding});
test(simpleObjectTest, {value: -0}, {value: negZeroEncoding});
test(simpleObjectTest, {value: NaN}, {value: nanEncoding});
test(simpleObjectTest, {value: undefined}, {value: undefinedEncoding});
test("object with 4n property", simpleObjectTest, {value: BigInt(4)}, {value: "B4"});

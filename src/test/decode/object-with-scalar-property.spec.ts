import test, {Macro} from "ava";
import {version} from "../../lib/utils";
import {decode, encode} from "../../lib";
import {
    infinityEncoding, nanEncoding, negInfinityEncoding, negZeroEncoding,
    SzrMetadata,
    SzrRepresentation, undefinedEncoding
} from "../../lib/szr-representation";

const emptyMetadata = [version, {}, {}] as SzrMetadata;

function attachMetadata(...arr): SzrRepresentation {
    return [emptyMetadata, ...arr];
}

const decodeScalarObjectPropTest: Macro<any> = (t, expected, input) => {
    t.deepEqual(decode(input), attachMetadata(expected));
};

decodeScalarObjectPropTest.title = (x, expected, input) => x ?? `object with ${expected.value} property`

test(decodeScalarObjectPropTest, {value: 1}, {value: 1});
test(decodeScalarObjectPropTest, {value: true}, {value: true});
test(decodeScalarObjectPropTest, {value: null}, {value: null});
test(decodeScalarObjectPropTest, {value: Infinity}, {value: infinityEncoding});
test(decodeScalarObjectPropTest, {value: -Infinity}, {value: negInfinityEncoding});
test(decodeScalarObjectPropTest, {value: -0}, {value: negZeroEncoding});
test(decodeScalarObjectPropTest, {value: NaN}, {value: nanEncoding});
test(decodeScalarObjectPropTest, {value: undefined}, {value: undefinedEncoding});
test("object with 4n property", decodeScalarObjectPropTest, {value: BigInt(4)}, {value: "B4"});

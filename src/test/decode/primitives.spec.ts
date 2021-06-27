import test, {ExecutionContext, Macro} from "ava";
import {decode, encode} from "../../lib";
import {} from "../../lib/szr";
import {
    infinityEncoding,
    negInfinityEncoding, negZeroEncoding, undefinedEncoding
} from "../../lib/szr-representation";

const decodeSimple: Macro<any> = (t: ExecutionContext, input, expected) => {
    t.is(decode(input), expected);
};

decodeSimple.title = (providedTitle ,input, expected) => providedTitle ??`primitive ${expected}`;

test(decodeSimple, 1, 1);
test(decodeSimple, true, true);
test(decodeSimple, null, null);
test(decodeSimple, infinityEncoding, Infinity);
test(decodeSimple, negInfinityEncoding, -Infinity);
test(decodeSimple, negZeroEncoding, -0);
test(decodeSimple, undefinedEncoding, undefined);
test("primitive 4n", decodeSimple, "B4", BigInt(4));

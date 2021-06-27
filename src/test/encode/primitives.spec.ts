import test, {ExecutionContext, Macro} from "ava";
import { encode } from "../../lib";
import {} from "../../lib/szr";
import {
    infinityEncoding,
    negInfinityEncoding, negZeroEncoding, undefinedEncoding
} from "../../lib/szr-representation";

const encodeSimpleValue: Macro<any> = (t: ExecutionContext, input, expected) => {
    t.is(encode(input), expected);
};

encodeSimpleValue.title = (providedTitle ,expected) => providedTitle ?? `primitive ${expected}`;

test(encodeSimpleValue, 1, 1);
test(encodeSimpleValue, true, true);
test(encodeSimpleValue, null, null);
test(encodeSimpleValue, Infinity, infinityEncoding);
test(encodeSimpleValue, -Infinity, negInfinityEncoding);
test(encodeSimpleValue, -0, negZeroEncoding);
test(encodeSimpleValue, undefined, undefinedEncoding);
test("primitive 4n", encodeSimpleValue, BigInt(4), "B4");

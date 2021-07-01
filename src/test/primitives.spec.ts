import {
    infinityEncoding, nanEncoding,
    negInfinityEncoding, negZeroEncoding,
    SzrOutput, undefinedEncoding
} from "../lib/internal/szr-representation";
import test, {ExecutionContext, Macro} from "ava";
import {decode, encode} from "../lib";
import {stringify} from "./utils";

const primtiveTests: Macro<any> = (t: ExecutionContext, decoded: any, encoded: SzrOutput) => {
    const rDecoded = decode(encoded);
    t.is(rDecoded, decoded);
    const rEncoded = encode(decoded);
    t.is(rEncoded, encoded);
};

primtiveTests.title = (title, decoded) => title ?? `primitive - ${stringify(decoded)}`;

test(primtiveTests, 1, 1);
test(primtiveTests, true, true);
test(primtiveTests, null, null);
test(primtiveTests, Infinity, infinityEncoding);
test(primtiveTests, -Infinity, negInfinityEncoding);
test(primtiveTests, -0, negZeroEncoding);
test(primtiveTests, NaN, nanEncoding);
test(primtiveTests, undefined, undefinedEncoding);
test("primitive 4n", primtiveTests, BigInt(4), "B4");

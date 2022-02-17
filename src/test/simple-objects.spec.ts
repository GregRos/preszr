import test from "ava";
import {
    infinityEncoding,
    nanEncoding,
    negInfinityEncoding,
    negZeroEncoding,
    undefinedEncoding
} from "../lib/data-types";
import { combAttachHeader, stringify, preszrDefaultHeader } from "./utils";
import { encode } from "../lib";

const simpleObjectTest = combAttachHeader(input => `{value: ${stringify(input.value)}}`);

test(simpleObjectTest, { value: 1 }, [{ value: 1 }]);
test(simpleObjectTest, { value: true }, [{ value: true }]);
test(simpleObjectTest, { value: null }, [{ value: null }]);
test(simpleObjectTest, { value: Infinity }, [{ value: infinityEncoding }]);
test(simpleObjectTest, { value: -Infinity }, [{ value: negInfinityEncoding }]);
test(simpleObjectTest, { value: -0 }, [{ value: negZeroEncoding }]);
test(simpleObjectTest, { value: NaN }, [{ value: nanEncoding }]);
test(simpleObjectTest, { value: undefined }, [{ value: undefinedEncoding }]);
test(simpleObjectTest, { value: BigInt(4) }, [{ value: "B4" }]);
test(simpleObjectTest, { value: "string" }, [{ value: "2" }, "string"]);
test("strings are interned", simpleObjectTest, { value: "string", value2: "string" }, [
    { value: "2", value2: "2" },
    "string"
]);
test(simpleObjectTest, { value: [] }, [{ value: "2" }, []]);

test("string", simpleObjectTest, "abc", ["abc"]);

test("object references object", simpleObjectTest, { a: {} }, [{ a: "2" }, {}]);
test("object references two objects", simpleObjectTest, { a: {}, b: {} }, [
    { a: "2", b: "3" },
    {},
    {}
]);

test("skips non-enumerable", t => {
    const x = {};
    Object.defineProperty(x, "test", {
        enumerable: false,
        value: "test"
    });
    const encoded = encode(x);
    t.deepEqual(encoded, preszrDefaultHeader({}));
});

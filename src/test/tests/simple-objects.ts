import test from "ava";
import { stringify } from "../utils";
import { items, preszr } from "../tools";
import { defaultPreszr } from "@lib/default";
import { symmetricTestUsingInner } from "../tools/macros-3";

const simpleObjectEncoding = symmetricTestUsingInner(defaultPreszr)
    .title(
        ({ title, decoded }) =>
            title ?? `single value - ${stringify(decoded.value)}`
    )
    .encodeDecodeDeepEqual();

test(simpleObjectEncoding, { value: 1 }, preszr(items({ value: 1 })));

test(simpleObjectEncoding, { value: true }, preszr(items({ value: true })));

test(simpleObjectEncoding, { value: null }, preszr(items({ value: null })));

test(
    simpleObjectEncoding,
    { value: Infinity },
    preszr(items({ value: "Infinity" }))
);

test(
    simpleObjectEncoding,
    { value: -Infinity },
    preszr(items({ value: "-Infinity" }))
);

test(simpleObjectEncoding, { value: -0 }, preszr(items({ value: "-0" })));

test(simpleObjectEncoding, { value: NaN }, preszr(items({ value: "NaN" })));

test(simpleObjectEncoding, { value: undefined }, preszr(items({ value: "-" })));

test(simpleObjectEncoding, { value: 4n }, preszr(items({ value: "B4" })));

test(
    simpleObjectEncoding,
    { value: "string" },
    preszr(items({ value: "2" }, "string"))
);

test(
    "strings are interned",
    simpleObjectEncoding,
    { a: "string", b: "string" },
    preszr(
        items(
            {
                a: "2",
                b: "2"
            },
            "string"
        )
    )
);

test(simpleObjectEncoding, { value: [] }, preszr(items({ value: "2" }, [])));

test("string", simpleObjectEncoding, "abc", preszr(items("abc")));

test(
    "object ref",
    simpleObjectEncoding,
    { a: {} },
    preszr(items({ a: "2" }, {}))
);

{
    const objWithNonEnumerable = {};
    Object.defineProperty(objWithNonEnumerable, "nonEnumerable", {
        enumerable: false
    });
    test("test object is set up right", t => {
        t.false(
            Object.getOwnPropertyDescriptor(
                objWithNonEnumerable,
                "nonEnumerable"
            ).enumerable
        );
    });

    test("skips non-enumerable", t => {
        const realEncoded = defaultPreszr.encode(objWithNonEnumerable);
        t.deepEqual(realEncoded, preszr(items({})));
    });
}

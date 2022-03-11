import test from "ava";
import { decode, encode } from "@lib";
import { items, preszr, testBuilder } from "../tools";
import { defaultPreszr } from "@lib/default";

const complexReferences = testBuilder(defaultPreszr).getSimple();
{
    const o = {};
    const siblingExample = {
        a: o,
        b: o
    };

    test(
        "sibling refs - structural",
        complexReferences,
        siblingExample,
        preszr(items({ a: "2", b: "2" }), items({}))
    );

    test("sibling references - identity", t => {
        const result = decode(encode(siblingExample)) as typeof siblingExample;
        t.is(result.a, result.b);
    });
}

{
    const circular = { self: undefined };
    circular.self = circular;
    test(
        "self ref - structural",
        complexReferences,
        circular,
        preszr(items({ self: "1" }))
    );
    test("self ref - identity", t => {
        const result = decode(encode(circular)) as typeof circular;
        t.is(result.self, result);
    });
}

{
    const circular = [];
    circular.push(circular);
    test(
        "array self ref - structural",
        complexReferences,
        circular,
        preszr(items(["1"]))
    );
    test("array self ref - identity", t => {
        const r = decode(encode(circular)) as typeof circular;
        t.is(r[0], r);
    });
}

{
    const mutuallyCircular1 = { other: undefined };
    const mutuallyCircular2 = { other: undefined };
    mutuallyCircular1.other = mutuallyCircular2;
    mutuallyCircular2.other = mutuallyCircular1;
    test(
        "mutually circular refs - structure",
        complexReferences,
        mutuallyCircular1,
        preszr(items({ other: "2" }, { other: "1" }))
    );
    test("mutually circular refs - identity", t => {
        const first = decode(
            encode(mutuallyCircular1)
        ) as typeof mutuallyCircular1;
        const other = first.other;
        t.is(other.other, first);
    });
}

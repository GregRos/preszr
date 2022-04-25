/* eslint-disable symbol-description */
import test from "ava";
import { getSymbolName, getUnrecognizedSymbol } from "../../lib/utils";
import { Preszr } from "@lib";
import { encoded, items, preszr, testBuilder } from "../tools";
import { Fixed } from "@lib/encodings/fixed";

function getSymbolKey(s: symbol) {
    return `${s.description}.S`;
}

const symb1 = Symbol("symbol1");
const symb2 = Symbol("symbol2");

test("unrecognized symbol name generator", t => {
    t.is(getSymbolName(getUnrecognizedSymbol("x")), "preszr unknown: x");
});

// First let's check recognized symbols only...
{
    const knows1 = Preszr([symb1]);

    const stdTest = testBuilder(knows1).get();

    const symbolEncName = getSymbolKey(symb1);
    test("symbol input", stdTest, {
        original: symb1,
        encoded: preszr(encoded(0, symbolEncName))
    });

    test("symbol value", stdTest, {
        original: { x: symb1 },
        encoded: preszr(items({ x: "2" }), encoded(0, symbolEncName))
    });

    test("symbol key", stdTest, {
        original: { [symb1]: 10 },
        encoded: preszr(
            encoded([{ "2": 10 }, {}], Fixed.Object),
            encoded(0, symbolEncName)
        )
    });
}
{
    const knows2 = Preszr([symb1, symb2]);
    const stdTest = testBuilder(knows2).get();

    test("two symbol keys", stdTest, {
        original: {
            [symb1]: 1,
            [symb2]: 2
        },
        encoded: preszr(
            encoded([{ "2": 1, "3": 2 }, {}], Fixed.Object),
            encoded(0, getSymbolKey(symb1)),
            encoded(0, getSymbolKey(symb2))
        )
    });

    test("two symbol keys, values", stdTest, {
        original: {
            [symb1]: symb2,
            [symb2]: symb1
        },
        encoded: preszr(
            encoded([{ "2": "3", "3": "2" }, {}], Fixed.Object),
            encoded(0, getSymbolKey(symb1)),
            encoded(0, getSymbolKey(symb2))
        )
    });

    test("symbol keys + regular keys", stdTest, {
        original: {
            [symb1]: 2,
            a: 3
        },
        encoded: preszr(
            encoded([{ 2: 2 }, { a: 3 }], Fixed.Object),
            encoded(0, getSymbolKey(symb1))
        )
    });
}

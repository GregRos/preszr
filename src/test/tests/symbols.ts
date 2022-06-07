/* eslint-disable symbol-description */
import test from "ava";
import {
    getSymbolName,
    getUnrecognizedSymbol,
    getUnrecognizedSymbolName
} from "../../lib/utils";
import { Preszr } from "@lib";
import { encoded, items, preszr, testBuilder } from "../tools";
import { FixedIndexes } from "@lib/encodings/fixed-indexes";

function getSymbolKey(s: symbol) {
    return `${s.description}.S`;
}

const symb1 = Symbol("symbol1");
const symb2 = Symbol("symbol2");

test("unrecognized symbol name generator", t => {
    t.is(getSymbolName(getUnrecognizedSymbol("x")), "preszr unknown: x");
});

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
            encoded([{ "2": 10 }, {}], FixedIndexes.Object),
            encoded(0, symbolEncName)
        )
    });

    test("unrecognized symbol value", t => {
        const encodedValue = knows1.encode(symb2);
        t.deepEqual(
            encodedValue,
            preszr(encoded(0, FixedIndexes.UnknownSymbol, "symbol2"))
        );
        const decodedValue = knows1.decode(encodedValue);
        t.is(typeof decodedValue, "symbol");
        t.is(getSymbolName(decodedValue), getUnrecognizedSymbolName("symbol2"));
    });

    test("unrecognized symbol still has ID", t => {
        const encodedValue = knows1.encode({
            a: symb2,
            b: symb2
        });
        t.deepEqual(
            encodedValue,
            preszr(
                items({ a: "2", b: "2" }),
                encoded(0, FixedIndexes.UnknownSymbol, "symbol2")
            )
        );
        const result = knows1.decode(encodedValue);
        t.is(typeof result.a, "symbol");
        t.is(result.a, result.b);
    });

    test("unrecognized symbol key", t => {
        const encodedValue = knows1.encode({
            [symb2]: 5
        });
        t.deepEqual(
            encodedValue,
            preszr(
                encoded([{ "2": 5 }, {}], FixedIndexes.Object),
                encoded(0, FixedIndexes.UnknownSymbol, "symbol2")
            )
        );
        const result = knows1.decode(encodedValue);
        const keys = Object.getOwnPropertySymbols(result);
        t.is(keys.length, 1);
        const [symbKey] = keys;
        t.is(typeof symbKey, "symbol");
        t.is(getSymbolName(symbKey), getUnrecognizedSymbolName("symbol2"));
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
            encoded([{ "2": 1, "3": 2 }, {}], FixedIndexes.Object),
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
            encoded([{ "2": "3", "3": "2" }, {}], FixedIndexes.Object),
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
            encoded([{ 2: 2 }, { a: 3 }], FixedIndexes.Object),
            encoded(0, getSymbolKey(symb1))
        )
    });
}

import test from "ava";
import { decode, encode, Preszr } from "@lib";
import { items, preszr, testBuilder } from "../tools";
import { defaultPreszr } from "@lib/default";

{
    class TestClass {}
    const symbol = Symbol("symbol1");
    const inst = Preszr(
        TestClass,
        symbol
    );

}

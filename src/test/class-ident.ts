import test from "ava";
import { Szr } from "../lib";

test("Szr as constructor", t => {
    const szr = new Szr();
    t.true(szr instanceof Szr);
    t.is(Object.getPrototypeOf(szr), Szr.prototype);
});

test("Szr as function", t => {
    const szr = Szr();
    t.true(szr instanceof Szr);
    t.is(Object.getPrototypeOf(szr), Szr.prototype);
});

import test from "ava";
import {Szr} from "../lib/szr";

function getCircular() {
    const a: any = {x: "a"};
    const c: any = {x: "c"};
    const b: any = {x: "b"};
    a.b = b;
    a.c = c;
    b.c = c;
    b.a = a;
    c.a = a;
    c.b = b;
    return a;
}

const srz = new Szr();

test("circular graph", t => {
    const result = srz.encode(getCircular());
    const a = srz.decode(result);
    const {b, c} = a;
    t.is(a.b, b);
    t.is(a.c, c);
    t.is(b.a, a);
    t.is(b.c, c);
    t.is(c.a, a);
    t.is(c.b, b);
});

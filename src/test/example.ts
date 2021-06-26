import "./setup";

import {Szr} from "../lib/szr";

const szr = new Szr();
const a: any = {x: "a"};
const c: any = {x: "c"};
const b: any = {x: "b"};
a.b = b;
a.c = c;
b.c = c;
b.a = a;
c.a = a;
c.b = b;
console.log(szr.encode(a));

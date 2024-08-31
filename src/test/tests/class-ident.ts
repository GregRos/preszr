import { Preszr } from "@lib"
import test from "ava"

test("Preszr as constructor", t => {
    const preszr = new Preszr()
    t.true(preszr instanceof Preszr)
    t.is(Object.getPrototypeOf(preszr), Preszr.prototype)
})

test("Preszr as function", t => {
    const preszr = Preszr()
    t.true(preszr instanceof Preszr)
    t.is(Object.getPrototypeOf(preszr), Preszr.prototype)
})

test("Preszr non-object options", t => {
    t.throws(() => Preszr(5 as any))
})

test("Preszr non-array encodes", t => {
    t.throws(() =>
        Preszr({
            encodes: 5 as any
        })
    )
})

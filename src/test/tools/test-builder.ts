import { Preszr } from "@lib"
import { PreszrOutput } from "@lib/data"
import test from "ava"
import { ExecutionContext } from "ava/types/test-fn"
import { TestBuilder } from "./base-test-builder"

export type TestArgs = {
    encoded: PreszrOutput
    original: any
    decoded?: any
}

export type EqualityAssertion = (t: ExecutionContext, decoded: any, original: any) => void

export class GenericTestBuilder extends TestBuilder<TestArgs> {
    private _equalityAssertion: EqualityAssertion

    eqAssertion(eq: EqualityAssertion) {
        return this.with({
            _equalityAssertion: eq
        })
    }

    protected _test(t: ExecutionContext, args): void {
        const { instance } = args
        const toEncoded = instance.encode(args.original)
        t.deepEqual(toEncoded, args.encoded, "REAL_ENCODED != EXPECTED_ENCODED")
        const decoded = "decoded" in args ? args.decoded : args.original
        const realDecoded = instance.decode(toEncoded)
        if (this._equalityAssertion) {
            this._equalityAssertion(t, realDecoded, decoded)
        } else {
            t.deepEqual(realDecoded, decoded, "REAL_DECODED != EXPECTED_DECODED")
        }
    }

    getSimple() {
        const self = this
        const originalMacro = self.get()
        return test.macro({
            title(title, original: any, encoded: PreszrOutput) {
                return originalMacro.title(title, {
                    original,
                    encoded
                })
            },
            exec(t, original: any, encoded: PreszrOutput) {
                return originalMacro.exec(t, {
                    encoded,
                    original
                })
            }
        })
    }
}

export function testBuilder(instance?: Preszr) {
    return new GenericTestBuilder().instance(instance)
}

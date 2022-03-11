import test, { TitleFn } from "ava";
import { PreszrFormat, PreszrOutput } from "@lib/data";
import { Preszr } from "@lib";
import { ExecutionContext } from "ava/types/test-fn";
import { TestBuilder } from "./base-test-builder";

export type TestArgs = {
    encoded: PreszrOutput;
    original: any
    decoded?: any;
}

export type EqualityAssertion = (t: ExecutionContext, decoded: any, original: any) => void | Promise<void>;


export class GenericTestBuilder extends TestBuilder<TestArgs> {
    private _equalityAssertion:EqualityAssertion;

    eqAssertion(eq: EqualityAssertion) {
        return this.with({
            _equalityAssertion: eq
        })
    }

    protected async _test(t: ExecutionContext, args): Promise<void> {
        const {instance} = args;
        const toEncoded = instance.encode(args.original);
        t.deepEqual(toEncoded, args.encoded, "REAL_ENCODED != EXPECTED_ENCODED");
        const decoded = "decoded" in args ? args.decoded : args.original;
        const realDecoded = instance.decode(toEncoded);
        if (this._equalityAssertion) {
            await this._equalityAssertion(t, realDecoded, decoded);
        } else {
            t.deepEqual(realDecoded, decoded, "REAL_DECODED != EXPECTED_DECODED");
        }
    }

    getSimple() {
        const self = this;
        const originalMacro = self.get();
        return test.macro({
            title: originalMacro.title,
            exec(t, original: any, encoded: PreszrOutput) {
                return originalMacro.exec(t, {
                    encoded,
                    original
                })
            }
        });
    }
}


export function testBuilder(instance?: Preszr) {
    return new GenericTestBuilder().instance(instance);
}


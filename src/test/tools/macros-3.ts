import test, { TitleFn } from "ava";
import { PreszrFormat } from "@lib/data";
import { Preszr } from "@lib";
import { ExecutionContext } from "ava/types/test-fn";
import { TestBuilder } from "./macros-2";

export type SymmetricTestArgs = {
    encoded: PreszrFormat;
    decoded: any;
}

export class SymmetricTestBuilder extends TestBuilder<SymmetricTestArgs> {
    protected _test(t: ExecutionContext, args): void | Promise<void> {
        const {instance, encoded, decoded} = args;
        const toEncoded = instance.encode(decoded);
        t.deepEqual(toEncoded, encoded, "ENCODED VALUE MISMATCH");
        const toDecoded = instance.decode(encoded);
        t.deepEqual(toDecoded, decoded, "DECODED VALUE MISMATCH");
    }

    getMultiArgument() {
        const self = this;
        const original = self.get();
        return test.macro({
            title: original.title,
            exec(t, decoded: any, encoded: PreszrFormat) {
                return original.exec(t, {
                    decoded, encoded});
            }
        });
    }
}

export function symmetricTestUsingInner(instance: Preszr) {
    return new SymmetricTestBuilder(instance);
}



import test, { TitleFn } from "ava";
import { PreszrFormat, PreszrOutput } from "@lib/data";
import { Preszr } from "@lib";
import { ExecutionContext } from "ava/types/test-fn";



export interface TestArgs {

}

export type TitleFunc<TArgs extends TestArgs> = (inputs: TArgs & {title: string}) => string;

export abstract class TestBuilder<TArgs extends TestArgs> {
    private _title: TitleFunc<TArgs>;
    private _instance: Preszr
    with(partial: any): this {
        const builder = Object.create(Object.getPrototypeOf(this));
        Object.assign(builder, this, partial);
        return builder;
    }

    instance(instance: Preszr) {
        return this.with({
            _instance: instance
        })
    }

    title(f: TitleFunc<TArgs>) {
        return this.with({
            _title: f
        })
    }

    protected abstract _test(t: ExecutionContext, args: TArgs & {instance: Preszr}): void | Promise<void>;

    get() {
        const self = this;
        return test.macro({
            async exec(t, args: TArgs){
                return self._test(t, {
                    ...args,
                    instance: self._instance
                });
            },
            title(title, args: TArgs) {
                return self._title({
                    ...args,
                    title
                })
            }
        })
    }

}


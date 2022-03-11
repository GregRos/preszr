import test, { TitleFn } from "ava";
import { PreszrFormat } from "@lib/data";
import { Preszr } from "@lib";
import { ExecutionContext } from "ava/types/test-fn";


export interface TitleArgs extends TestArgs {
    title: string;
}

export interface TestArgs {

}

export type TitleFunc<TArgs extends TestArgs> = (inputs: TArgs & {title: string}) => string;

export abstract class TestBuilder<TArgs extends TestArgs> {
    private _title: TitleFunc<TArgs>;
    constructor(private _instance: Preszr) {}

    title(f: TitleFunc<TArgs>) {
        this._title = f;
        return this;
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


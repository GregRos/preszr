import { Preszr } from "@lib"
import test from "ava"
import { ExecutionContext } from "ava/types/test-fn"

export interface TestArgs {}

export type TitleFunc<TArgs extends TestArgs> = (inputs: TArgs & { title: string }) => string

export abstract class TestBuilder<TArgs extends TestArgs> {
    private _title: TitleFunc<TArgs>
    private _instance: Preszr
    with(partial: any): this {
        const builder = Object.create(Object.getPrototypeOf(this))
        Object.assign(builder, this, partial)
        return builder
    }

    instance(instance: Preszr) {
        return this.with({
            _instance: instance
        })
    }

    title(f: TitleFunc<TArgs> | string) {
        return this.with({
            _title: typeof f === "string" ? () => f : f
        })
    }

    protected abstract _test(t: ExecutionContext, args: TArgs & { instance: Preszr }): void

    get() {
        const self = this
        return test.macro({
            exec(t, args: TArgs) {
                return self._test(t, {
                    ...args,
                    instance: self._instance ?? Preszr()
                })
            },
            title(title, args: TArgs) {
                return (
                    self._title?.({
                        ...args,
                        title
                    }) ?? title
                )
            }
        })
    }
}

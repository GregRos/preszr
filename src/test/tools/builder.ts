import { Inspector } from "./inspector";
import { PreszrFormat } from "@lib/data";

export class BuilderToken {
    constructor(public apply: (inspector: Inspector) => void) {}
}

export function preszr(...tokens: BuilderToken[]) {
    const msg: PreszrFormat = [["0" as const, [], {}, {}]];
    const wrapper = new Inspector(msg);
    for (const tk of tokens) {
        tk.apply(wrapper);
    }
    return wrapper.get();
}

export function encoded(value: any, encoding: string | number, metadata?: any) {
    return new BuilderToken(insp => {
        insp.push(value, encoding, metadata);
    });
}

export function items(...values: any[]) {
    return new BuilderToken(insp => {
        for (const value of values) {
            insp.push(value);
        }
    });
}

const PRESZR_DECODED = Symbol("PRESZR_DECODED")
export default function embedTrace(target: any, encodingKey: string) {
    if (target[PRESZR_DECODED]) {
        throw new Error("Already decoded")
    }
    Object.defineProperty(target, PRESZR_DECODED, {
        value: encodingKey,
        enumerable: false,
        writable: true,
        configurable: true
    })
}

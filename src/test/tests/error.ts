import { defaultPreszr } from "@lib/default"
import { FixedIndexes } from "@lib/encodings/fixed-indexes"
import test from "ava"
import { encoded, items, preszr, testBuilder } from "../tools"

export const fullErrorEquality = testBuilder()
    .title(({ original }) => `Error Equality: ${original.constructor.name}`)
    .eqAssertion((t, decoded, original) => {
        t.deepEqual(decoded, original, "DECODED != ORIGINAL")
        t.like(
            decoded,
            {
                message: original.message,
                stack: original.stack,
                name: original.name
            },
            "DECODED != ORIGINAL"
        )
    })

const checkErrorMacro = fullErrorEquality.instance(defaultPreszr)
{
    const regularError = new Error("hi")

    test(
        checkErrorMacro.getSimple(),
        regularError,
        preszr(
            encoded(
                {
                    stack: "2",
                    name: "3",
                    message: "4"
                },
                FixedIndexes.Error
            ),
            items(regularError.stack, regularError.name, regularError.message)
        )
    )
}
const encodedError = (err: Error, type: number | string) => {
    return preszr(
        encoded(
            {
                stack: "2",
                name: "3",
                message: "4"
            },
            type
        ),
        items(err.stack, err.name, err.message)
    )
}
{
    const syntaxError = new SyntaxError("A SyntaxError")
    const typeError = new TypeError("A TypeError")
    const uriError = new URIError("A URIError")
    const evalError = new EvalError("A EvalError")
    const refError = new ReferenceError("A ReferenceError")
    const rangeError = new RangeError("A RangeError")
    test(
        checkErrorMacro.getSimple(),
        syntaxError,
        encodedError(syntaxError, FixedIndexes.SyntaxError)
    )
    test(checkErrorMacro.getSimple(), typeError, encodedError(typeError, FixedIndexes.TypeError))
    test(checkErrorMacro.getSimple(), uriError, encodedError(uriError, FixedIndexes.URIError))
    test(checkErrorMacro.getSimple(), evalError, encodedError(evalError, FixedIndexes.EvalError))
    test(checkErrorMacro.getSimple(), refError, encodedError(refError, FixedIndexes.ReferenceError))
    test(checkErrorMacro.getSimple(), rangeError, encodedError(rangeError, FixedIndexes.RangeError))
}
function assignError(x: any) {
    return Object.assign(new Error(), {
        ...x,
        message: x.message,
        stack: x.stack,
        name: x.name
    })
}
{
    class SubError extends Error {
        name = "SubError"
        newKey = "x"
    }

    ;(SubError.prototype as any).protoKey = "protoKey"
    SubError.prototype.name = "SubError"
    const err3 = new SubError("test")

    test(checkErrorMacro.get(), {
        original: err3,
        encoded: preszr(
            encoded(
                {
                    stack: "4",
                    name: "2",
                    message: "5",
                    newKey: "3"
                },
                FixedIndexes.Error
            ),
            items("SubError", "x", err3.stack, "test")
        ),
        decoded: assignError(err3)
    })
}

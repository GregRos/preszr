import test from "ava";
import { Preszr } from "@lib";
import { PreszrFormat } from "@lib/data";
import { encoded, items, preszr } from "../tools";
import { Fixed } from "@lib/encodings/fixed";
import { defaultPreszr } from "@lib/default";
import { assymetricTest } from "../tools/special-assertion-test-builder";

export const fullErrorEquality = p => assymetricTest(p)
.title(({ original }) => `Error Equality: ${original.constructor.name}`)
        .eqAssertion((t, decoded, original) => {
            t.deepEqual(decoded, original, "DECODED != ORIGINAL");
            t.like(
                decoded,
                {
                    message: original.message,
                    stack: original.stack,
                    name: original.name
                },
                "DECODED != ORIGINAL"
            );

        }).getSimple()

const checkErrorMacro = fullErrorEquality(defaultPreszr);
{
    const regularError = new Error("hi");

    test(
        checkErrorMacro,
        regularError,
        preszr(
            encoded(
                {
                    stack: "2",
                    name: "3",
                    message: "4"
                },
                Fixed.Error
            ),
            items(regularError.stack, regularError.name, regularError.message)
        )
    );
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
    );
};
{
    const syntaxError = new SyntaxError("A SyntaxError");
    const typeError = new TypeError("A TypeError");
    const uriError = new URIError("A URIError");
    const evalError = new EvalError("A EvalError");
    const refError = new ReferenceError("A ReferenceError");
    const rangeError = new RangeError("A RangeError");
    test(
        checkErrorMacro,
        syntaxError,
        encodedError(syntaxError, Fixed.SyntaxError)
    );
    test(checkErrorMacro, typeError, encodedError(typeError, Fixed.TypeError));
    test(checkErrorMacro, uriError, encodedError(uriError, Fixed.URIError));
    test(checkErrorMacro, evalError, encodedError(evalError, Fixed.EvalError));
    test(
        checkErrorMacro,
        refError,
        encodedError(refError, Fixed.ReferenceError)
    );
    test(
        checkErrorMacro,
        rangeError,
        encodedError(rangeError, Fixed.RangeError)
    );
}

{
    class SubError extends Error {
        name = "SubError";
        newKey = "x";
    }

    (SubError.prototype as any).protoKey = "protoKey";
    SubError.prototype.name = "SubError";
    const err3 = new SubError("test");

    test(
        checkErrorMacro,
        err3,
        preszr(
            encoded(
                {
                    stack: "4",
                    name: "2",
                    message: "5",
                    newKey: "3"
                },
                Fixed.Error
            ),
            items("SubError", "x", err3.stack, "test")
        )
    );
}

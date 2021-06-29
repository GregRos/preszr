import test, {ExecutionContext} from "ava";
import {decode, encode} from "../lib";
import {encodeDecodeMacro, testEncodeMacro} from "./utils";
import {getLibraryString} from "../lib/utils";

function errorsEqualWithTrace(err1: Error, err2: Error) {
    return Object.getPrototypeOf(err1) === Object.getPrototypeOf(err2) &&
        err1.name === err2.name &&
        err1.message === err2.message &&
        err1.stack === err2.stack;
}
export const errorDecodeMacro: any = (t: ExecutionContext, decoded: any, encoded: any) => {
    const rDecoded = decode(encoded);
    t.is(rDecoded.name, decoded.name);
    t.is(rDecoded.stack, decoded.stack);
    t.is(rDecoded.message, decoded.message);
    t.deepEqual(Object.getPrototypeOf(rDecoded), Object.getPrototypeOf(decoded));
    t.deepEqual(rDecoded, decoded);
};

function getErrorFields(err: Error) {
    const err2 = {...err};
    for (const key of ["stack", "name", "message"]) {
        if (Object.prototype.hasOwnProperty.call(err, key)) {
            err2[key] = err[key];
        }
    }
}

const macro = encodeDecodeMacro({
    encode: testEncodeMacro,
    decode: errorDecodeMacro
});
const err1 = new Error("hi");

test("regular error", macro, err1, [
    [{1: getLibraryString("Error")}, {}],
    {
        stack: "2",
        name: "3",
        message: "4"
    },
    err1.stack,
    err1.name,
    err1.message
]);

const err2 = new SyntaxError("blah");

test("error subclass", macro, err2, [
    [{1: getLibraryString("SyntaxError")}, {}],
    {
        stack: "2",
        name: "3",
        message: "4"
    },
    err2.stack,
    err2.name,
    err2.message
]);

class SubError extends Error {

}
SubError.prototype.name = "SubError";
const err3 = new SubError();


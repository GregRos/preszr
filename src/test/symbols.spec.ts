import test, {Implementation, UntitledMacro} from "ava";
import {decode, encode} from "../lib";
import {createSzrRep, createWithTitle, embedSzrVersion, testDecodeMacro, testEncodeMacro} from "./utils";
import {objectEncoding, unsupportedEncodingKey} from "../lib/encodings/basic";
import {unrecognizedSymbolKey} from "../lib/szr-representation";
import {getSymbolName, getUnrecognizedSymbol, getUnrecognizedSymbolName} from "../lib/utils";

const testSymbol = Symbol("test");
const testSymbol2 = Symbol("test");
const unrecognizedSymbolMacro = (decodeImpl: UntitledMacro<[any]>) => {
    return [
        createWithTitle(testEncodeMacro, (decoded, encoded) => [decoded, embedSzrVersion(encoded)], title => `encode :: ${title}`),
        createWithTitle(decodeImpl, (decoded, encoded) => [embedSzrVersion(encoded)], title => `decode :: ${title}`)
    ] as [any, any];
};

test("unrecognized symbol name generator", t => {
    t.is(getSymbolName(getUnrecognizedSymbol("x")), "szr unknown: x");
});

test("unrecognized symbol input", unrecognizedSymbolMacro((t, encoded) => {
    const decoded = decode(encoded);
    t.is(typeof decoded, "symbol");
    t.is(decoded.description, getUnrecognizedSymbolName("test"));
}), testSymbol, [[{1: unrecognizedSymbolKey}, {1: "test"}], 0]);

test("unrecognized symbol property value", unrecognizedSymbolMacro((t, encoded) => {
    const decoded = decode(encoded);
    t.is(typeof decoded.a, "symbol");
    t.is(decoded.a.description, getUnrecognizedSymbolName("test"));
}), {a: testSymbol}, [[{2: unrecognizedSymbolKey}, {2: "test"}], {a: "2"}, 0]);

test("two unrecognized symbol values", unrecognizedSymbolMacro((t, encoded) => {
    const decoded = decode(encoded);
    t.is(typeof decoded.a, "symbol");
    t.is(decoded.a.description, getUnrecognizedSymbolName("test"));
}), {a: testSymbol, b: testSymbol2}, [[{2: unrecognizedSymbolKey, 3: unrecognizedSymbolKey}, {2: "test", 3: "test"}], {a: "2", b: "3"}, 0, 0]);

test("unrecognized symbol key", unrecognizedSymbolMacro((t, encoded) => {
    const decoded = decode(encoded);
    const [key] = Reflect.ownKeys(decoded);
    t.is(typeof key, "symbol");
    t.is((key as any).description, getUnrecognizedSymbolName("test"));
    t.is(decoded[key], 1);
}), {[testSymbol]: 1}, [[{1: objectEncoding.key,2: unrecognizedSymbolKey}, {2: "test"}], [{}, {2: 1}], 0]);



test("two different unrecognized symbol properties", t => {
    const encoded = encode({})
});

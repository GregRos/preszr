import { Encoding, PrototypeEncoding, SymbolEncoding } from "../interface";
import { getCtorName, getPrototypeName } from "../utils";
import { PreszrError } from "./index";

export const errorDefinitions = {
    "bug/config/fixed-index-collision"(nw: Encoding, existing: Encoding) {
        return `Couldn't register ${nw} because ${existing} has the same fixed index.`;
    },
    "bug/config/unknown-encoding"(encoding: any) {
        return `Encoding ${encoding} was of an unknown type.`;
    },
    "bug/encode/proto-without-match"(proto: object) {
        return `Failed to find an encoding for prototype ${getPrototypeName(
            proto
        )}`;
    },
    "bug/encode/no-highest-version"(encoding: PrototypeEncoding) {
        return `No max version set for prototype ${getPrototypeName(
            encoding.encodes
        )}`;
    },
    "config/bad-type"(value: any) {
        return `Configobject passed to Preszr must be an object, but was a ${typeof value}`;
    },
    "config/encodes/not-array"(value: any) {
        return `config.encodes must be an array, but was: ${value}`;
    },
    "config/proto/couldnt-get-prototype"(ctor: Function) {
        return `Couldn't get prototype for constructor ${getCtorName(ctor)}`;
    },
    "config/proto/encoding-exists"(encoding: PrototypeEncoding) {
        return `Encoding with name, version ${encoding} already exists.`;
    },
    "config/proto/name-collision"(
        existing: PrototypeEncoding,
        encoding: PrototypeEncoding
    ) {
        return `Tried to register ${encoding}, but ${existing} has the same name and encodes another prototype.`;
    },
    "config/proto/proto-collision"(
        existing: PrototypeEncoding,
        nw: PrototypeEncoding
    ) {
        return `Tried to register ${nw}, but encoding ${existing} already encodes the same prototype.`;
    },
    "config/proto/version/bad-type"(encoding: PrototypeEncoding) {
        return `In encoding ${encoding}, version is ${typeof encoding.version}. It should be a number.`;
    },
    "config/proto/version/bad-range"(
        [min, max]: number[],
        encoding: PrototypeEncoding
    ) {
        return `Version must be between ${min} and ${max}, but was ${encoding.version}`;
    },
    "config/proto/version/not-safe"(encoding: PrototypeEncoding) {
        return `Version must be a safe integer, but was ${encoding.version}`;
    },
    "config/spec/bad-encodes"(type: string) {
        return `'encodes' property on a spec must be a symbol, function, or object. It was a ${type}.`;
    },
    "config/spec/name-illegal-builtin"(proto: object) {
        return `'Name' property is illegal because ${getPrototypeName(
            proto
        )} is built-in. Remove it.`;
    },
    "config/spec/proto/no-name"(proto: object) {
        return `Couldn't get the prototype's name. Add a 'name' property.`;
    },
    "config/spec/proto/bad-name"(name: string) {
        return `Spec has the name '${name}', which isn't a string.`;
    },
    "config/spec/bad-type"(spec: any) {
        return `Encoding spec must be an object, symbol, function, or class. It was a ${typeof spec}.`;
    },
    "config/spec/no-encodes"() {
        return "The encoding spec had no 'encodes' property.";
    },
    "config/symbol/already-encoded"(
        existing: SymbolEncoding,
        nw: SymbolEncoding
    ) {
        return `Symbol ${String(
            nw.encodes
        )} already has an encoding, ${existing}.`;
    },
    "config/symbol/no-name"(s: symbol) {
        return `Couldn't get a name for symbol ${String(
            s
        )}. Create a spec with a 'name' property.`;
    },
    "config/symbol/name-exists"(existing: SymbolEncoding) {
        return `Tried register symbol encoding, but encoding ${existing} with the same name.`;
    },
    "decode/create/decode/call"() {
        return `Illegal call to 'decode' during CREATE phase. You must only call it during INIT.`;
    },
    "decode/init/decode/unknown-scalar"(input: any) {
        return `Tried to decode ${input}, which isn't a valid scalar.`;
    },
    "decode/init/decode/bad-reference"(input: any) {
        return `Reference #${input} doesn't match any object.`;
    },
    "decode/init/decode/bad-type"(input: any) {
        return `'decode' was called with argument ${input}, which isn't a valid scalar.`;
    },
    "decode/init/decode/not-numeric"(input: any) {
        return `'decode'`;
    },
    "decode/input/bad-header"(header: object) {
        return `Input had a non-array header, ${header}.`;
    },
    "decode/input/header/empty-array"() {
        return `Header was an empty array.`;
    },
    "decode/input/version/mismatch"(inputVersion: string, myVersion: string) {
        return `Input had preszr version ${inputVersion}, but preszr is version ${myVersion}`;
    },
    "decode/input/version/not-numeric"(version: string) {
        return `Input had version ${version}, which is not numeric.`;
    },
    "decode/input/version/not-string"(value: string) {
        return `Input version needs to be a string, but it was a ${typeof value}.`;
    },
    "decode/input/header/no-map"() {
        return `Header had no encoding map, or it wasn't a plain object.`;
    },
    "decode/input/header/no-metadata"() {
        return `Header had no metadata, or metadata was not a plain object.`;
    },
    "decode/input/header/no-keys"() {
        return `Header had no key list, or key list wasn't an array.`;
    },
    "decode/input/header/too-long"(header: any[]) {
        return `Header had ${header.length} elements. It must have 4.`;
    },
    "decode/input/no-data"() {
        return `Header is fine, but input had no data elements.`;
    },
    "decode/input/empty-array"() {
        return `Input was an empty array.`;
    },
    "decode/input/not-array"(input: any) {
        return `Input was a non-array object, ${input}.`;
    },
    "decode/input/unknown-scalar"(v: any) {
        return `Input was ${v}, which is an unknown scalar.`;
    },
    "decode/input/bad-type"(v: any) {
        return `Input was ${typeof v}, an invalid type.`;
    },
    "decode/keys/bad-type"(value: any) {
        return `Encoding key must be a string, but it was a ${typeof value}.`;
    },
    "decode/keys/bad-format"(key: string) {
        return `Encoding key '${key}' has an unknown format.`;
    },
    "decode/map/unknown-builtin-index"(index: number) {
        return `Encoding map refers to #${index}, a reserved index, but it's unused.`;
    },
    "decode/map/unknown-index"(index: number) {
        return `Encoding map refers to #${index}, but it wasn't in the key list.`;
    },
    "decode/keys/unknown-proto"(name: string) {
        return `No proto encoding named ${name}, for any version.`;
    },
    "decode/keys/unknown-proto-version"(
        name: string,
        wantedVersion: number,
        existing: PrototypeEncoding
    ) {
        return `No match for ${name}@${wantedVersion}, but ${existing} exists.`;
    },
    "decode/keys/unknown-symbol"(name: string) {
        return `No symbol encoding named ${name}.`;
    }
};

export type ErrorDefinitions = typeof errorDefinitions;

export type ErrorCode = keyof ErrorDefinitions;

export function getErrorByCode<T extends ErrorCode>(code: T) {
    const func = errorDefinitions[code];
    return (...args: Parameters<typeof func>) => {
        const message = (func as any).apply(errorDefinitions, args);
        return new PreszrError(code, message);
    };
}

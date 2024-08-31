import { Encoding } from ".."
import { getThingName, version } from "../utils"
import { ParseError } from "./parse-errors"

export class Preszr extends Error {
    constructor(
        public readonly message: string,
        readonly exemplar: any
    ) {
        super(message)
    }
}

function config(rest: string) {
    return `Config – ${rest}`
}

export function invalidConfig(value: any) {
    return new Preszr(config("invalid configuration."), value)
}

export function bug_fixedIndexCollision(nw: Encoding, existing: Encoding) {
    return new Preszr(
        config(
            `Encodings ${nw}, ${existing} both use fixed index ${nw.fixedIndex}. This is probably a bug.`
        ),
        [nw, existing]
    )
}

export function config_encoding_failedToInfer(input: any) {
    return new Preszr(
        config(
            `Failed to infer name or prototype from ${getThingName(
                input
            )}. Specify them explicitly.`
        ),
        input
    )
}

export function config_encoding_invalid_encodes(encodes: any) {
    return new Preszr(
        config(`encoding had an invalid encodes property ${getThingName(encodes)}`),
        encodes
    )
}

export function config_encoding_fullCollision(existing: Encoding, another: Encoding) {
    return new Preszr(config(`encoding ${existing.simpleKey} was specified twice.`), [
        existing,
        another
    ])
}

export function config_encoding_targetCollision(existing: Encoding, encoding: Encoding) {
    return new Preszr(
        config(
            `encodings ${encoding.name}, ${
                existing.name
            } can't both encode ${getThingName(existing.encodes)}`
        ),
        [existing, encoding]
    )
}

export function config_nameIllegalBuiltIn(encoding: Encoding) {
    return new Preszr(
        config(
            `encoding for built-in ${getThingName(
                encoding.encodes
            )} had the name '${encoding.name}', which is illegal.`
        ),
        [encoding]
    )
}

function config_encoding(encoding: Encoding, rest: string) {
    return config(`Encoding ${encoding.simpleKey} – ${rest}`)
}

export function config_encoding_bad(encoding: any) {
    return new Preszr(
        config(
            `encoding ${getThingName(
                encoding
            )} wasn't an object or didn't have the required structure`
        ),
        undefined
    )
}

export function config_encoding_badVersion(encoding: Encoding, wasnt: any) {
    return new Preszr(
        config_encoding(encoding, `had version ${wasnt}, which is not an int between 0 and 999`),
        [encoding]
    )
}

export function config_encoding_badName(encoding: Encoding) {
    return new Preszr(
        config_encoding(
            encoding,
            `had a name of type ${getThingName(encoding.name)}, which isn't valid.`
        ),
        encoding
    )
}

function decode(rest: string) {
    return `Decode – ${rest}`
}

function bad(rest: string) {
    return decode(`Invalid – ${rest}`)
}

function parseError(code: ParseError) {
    return `ParseError 0x${code.toString(16).toUpperCase()}`
}

export function decode_input_badString(value: any) {
    return new Preszr(decode(`input was an invalid string.`), value)
}

export function decode_input_badType(value: any) {
    return new Preszr(decode(`input was a ${getThingName(value)}, which is invalid`), value)
}

export function decode_badMessage(code: ParseError, value: any) {
    return new Preszr(bad(`not a preszr message (${parseError(code)}).`), value)
}

export function decode_badHeader(code: ParseError, value: any) {
    return new Preszr(
        bad(
            `invalid header (${parseError(
                code
            )}). Not a preszr message or corrupted. ${JSON.stringify(value)}`
        ),
        value
    )
}

export function decode_badMessageVersion(headerVersion: string) {
    return new Preszr(
        bad(
            `message was created by v${headerVersion}, but this library is v${version}, which is incompatible`
        ),
        headerVersion
    )
}

export function decode_unknownEncoding(type: string, name: string) {
    return new Preszr(
        decode(`message refers to ${type} encoding ${name}, but the decoder doesn't have it.`),
        [name, version]
    )
}

export function decode_unknownEncodingVersion(name: string, version: number) {
    return new Preszr(
        decode(
            `message referred to encoding ${name} version ${version}, but the decoder doesn't have that version.`
        ),
        [name, version]
    )
}

function decode_encoding_error(encoding: Encoding, rest: string) {
    return decode(`${encoding.simpleKey} – ${rest}`)
}

function encode_encoding_error(encoding: Encoding, rest: string) {
    return encode(`${encoding.simpleKey} – ${rest}`)
}

export function decode_encoding_badCall(encoding: Encoding, methodName: string, stage: string) {
    return new Preszr(
        decode_encoding_error(
            encoding,
            `called ${methodName} at ${stage.toUpperCase()}, which is illegal`
        ),
        [encoding, methodName, stage]
    )
}

export function encode_require_cycle(cyclePoint: any) {
    return new Preszr(encode(`cycle in requirements mechanism. this is a bug.`), {
        cycleStartsAt: cyclePoint
    })
}

export function decode_encoding_decode_badType(encoding: Encoding, value: any) {
    return new Preszr(
        decode_encoding_error(
            encoding,
            `called decode with a ${getThingName(value)} which isn't a basic primitive`
        ),
        [encoding, value]
    )
}

export function decode_encoding_refOutOfBounds(caller: Encoding, value: any) {
    return new Preszr(
        decode_encoding_error(caller, `tried to decode ref "${value}", but it was out of bounds.`),
        [caller, value]
    )
}

function warn(rest: string) {
    return `[Preszr] ${rest}`
}
function encode(rest: string) {
    return `Encode – ${rest}`
}
export function warn_encode_unknown_prototype(proto: object, instead: Encoding) {
    return warn(
        encode(
            `tried to encode unknown prototype ${getThingName(proto)}. Encoding ${
                instead.simpleKey
            } was used instead, which may result in broken objects. To get rid of this message, register the prototype.`
        )
    )
}

export function decode_type_unsupported_in_environment(name: string) {
    return new Preszr(
        `Message contained an encoding of type ${name}, but it doesn't exist in this environment.`,
        name
    )
}

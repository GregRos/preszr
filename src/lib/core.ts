import {
    Encoding,
    PreszrConfig,
    PrototypeEncoding,
    type EncodingSpecifier
} from "./interface";
import {
    getUnrecognizedSymbol,
    isFunction,
    isObject,
    isReference,
    version
} from "./utils";
import {
    EncodedEntity,
    noResultPlaceholder,
    PreszrFormat,
    PreszrOutput,
    ResultType,
    tryDecodeScalar,
    tryEncodeScalar
} from "./data";
import { arrayEncoding, getDefaultStore, objectEncoding } from "./encodings";
import { EncodeCtx } from "./encode/encode-context";
import { FixedIndexes } from "./encodings/fixed-indexes";
import { DecodeContext } from "./encode/decode-context";
import { getErrorByCode } from "./errors/texts";
import {
    decode_badHeader,
    decode_badMessage,
    decode_badMessageVersion,
    decode_input_badString,
    decode_input_badType,
    invalidConfig
} from "./errors/texts2";
import { ParseError } from "./errors/errors";
import embedTrace from "./embed-trace";

/**
 * The class used to encode and decode things in the preszr format.
 */
export class Preszr {
    private _store = getDefaultStore();

    constructor(config?: Partial<PreszrConfig<any>>) {
        if (config && !isObject(config)) {
            throw invalidConfig(config);
        }
        config ??= defaultConfig;
        if (config.encodes && !Array.isArray(config.encodes)) {
            throw invalidConfig(config);
        }

        this._store.add(...(config.encodes ?? []));
        for (const key of Object.getOwnPropertyNames(Preszr.prototype)) {
            if (key === "constructor") {
                continue;
            }
            const value = (this as any)[key];
            if (isFunction(value)) {
                (this as any)[key] = value.bind(this);
            }
        }
    }

    private _checkHeaderWellformed(input: PreszrFormat) {
        let versionInfo = "" as any;
        if (!Array.isArray(input)) {
            throw decode_badMessage(ParseError.message__not_array, input);
        } else if (input.length < 2) {
            throw decode_badMessage(
                ParseError.message__length_less_than_2,
                input
            );
        } else {
            const header = input?.[0];

            if (!header) {
                throw decode_badMessage(ParseError.message__no_header, input);
            } else if (!Array.isArray(header)) {
                throw decode_badMessage(
                    ParseError.message__header_not_array,
                    input
                );
            } else {
                versionInfo = header[0];
                if (versionInfo == null) {
                    throw decode_badMessage(
                        ParseError.message__header_empty,
                        versionInfo
                    );
                } else if (typeof versionInfo !== "string") {
                    throw decode_badMessage(
                        ParseError.message__header_version_not_string,
                        versionInfo
                    );
                } else if (versionInfo !== version) {
                    throw decode_badMessageVersion(versionInfo);
                } else if (!Array.isArray(header[1])) {
                    throw decode_badHeader(
                        ParseError.header__key_list_not_array,
                        header
                    );
                } else if (!header[2]) {
                    throw decode_badHeader(
                        ParseError.header__no_encoding_map,
                        header
                    );
                } else if (
                    typeof header[2] !== "object" ||
                    Array.isArray(header[2])
                ) {
                    throw decode_badHeader(
                        ParseError.header__encoding_map_not_object,
                        header
                    );
                } else if (!header[3]) {
                    throw decode_badHeader(
                        ParseError.header__no_metadata,
                        header
                    );
                } else if (
                    typeof header[3] !== "object" ||
                    Array.isArray(header[3])
                ) {
                    throw decode_badHeader(
                        ParseError.header__metadata_not_object,
                        header
                    );
                } else if (header[4] == null) {
                    throw decode_badHeader(
                        ParseError.header__no_root_reference,
                        header
                    );
                } else if (
                    typeof header[4] !== "number" ||
                    !Number.isInteger(header[4])
                ) {
                    throw decode_badHeader(
                        ParseError.header__root_reference_not_integer,
                        header
                    );
                }
            }
        }
        this._checkHeaderContents(input);
    }

    private _checkHeaderContents(input: PreszrFormat) {
        const [[, encodingKeys, encodingSpec, metadata, root], data] = input;
        const uniqueKeys = new Set<string>(encodingKeys);
        if (uniqueKeys.size !== encodingKeys.length) {
            throw decode_badHeader(ParseError.header__key_duplicate, input);
        }
        for (const key in encodingSpec) {
            if (!Object.prototype.hasOwnProperty.call(encodingSpec, key)) {
                continue;
            }
            const val = encodingSpec[key];
            if (!isReference(key)) {
                throw decode_badHeader(
                    ParseError.header__encoding_map_key_not_reference,
                    key
                );
            }
            if (typeof val !== "number" || !Number.isInteger(val)) {
                throw decode_badHeader(
                    ParseError.header__encoding_map_value_not_index,
                    val
                );
            }

            if (val < 0 || val - FixedIndexes.End >= encodingKeys.length) {
                throw decode_badHeader(
                    ParseError.header__encoding_map_index_out_of_bounds,
                    input
                );
            }
            if (+key >= input.length) {
                throw decode_badHeader(
                    ParseError.header__encoding_map_key_out_of_bounds,
                    key
                );
            }
        }
        for (const key in metadata) {
            if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
                continue;
            }
            if (!isReference(key)) {
                throw decode_badHeader(
                    ParseError.header__metadata_key_not_reference,
                    key
                );
            }
            if (+key >= input.length) {
                throw decode_badHeader(
                    ParseError.header__metadata_key_out_of_bounds,
                    key
                );
            }
        }

        if (root < 0 || root >= input.length) {
            throw decode_badHeader(
                ParseError.header__root_reference_out_of_bounds,
                root
            );
        }
    }

    decode(input: PreszrOutput): any {
        if (!isObject(input)) {
            // This is for scalar inputs. These correspond to primitive types except string and symbol.
            const tryScalar = tryDecodeScalar(input);
            switch (tryScalar.type) {
                case ResultType.Scalar:
                    return tryScalar.value;
                case ResultType.BadString:
                case ResultType.Reference:
                    throw decode_input_badString(input);
                default:
                case ResultType.BadType:
                    throw decode_input_badType(input);
            }
        }

        input = input as PreszrFormat;
        // We check the header is in Preszr format.
        this._checkHeaderWellformed(input);
        // Deconstruct the header to its parts
        const [[, encodingKeys, encodingSpec, metadata, root]] = input;
        const targetArray = Array(input.length - 1);
        const needToInit = new Map<number, PrototypeEncoding>();
        const states = new Map<number, any>();
        // For optimization purposes, create one instance of `InitContext`.
        const ctx = new DecodeContext(targetArray);
        const encodingByIndex = [] as Encoding[];

        // Check all encoding keys are present.
        for (const encodingKey of encodingKeys) {
            encodingByIndex.push(this._store.mustGetByKey(encodingKey));
        }

        // Start decoding the payload.
        for (let i = 1; i < input.length; i++) {
            const encodingIndex = encodingSpec[i];
            const cur = input[i] as EncodedEntity;
            let encoding: Encoding;
            if (encodingIndex == null) {
                if (typeof cur === "string") {
                    targetArray[i] = cur;
                    continue;
                }
                if (Array.isArray(cur)) {
                    encoding = arrayEncoding as any;
                } else {
                    encoding = objectEncoding;
                }
            } else if (encodingIndex === FixedIndexes.UnknownSymbol) {
                targetArray[i] = getUnrecognizedSymbol(metadata[i] as string);
                continue;
            } else if (encodingIndex < FixedIndexes.End) {
                encoding = this._store.mustGetByIndex(encodingIndex);
            } else {
                encoding = encodingByIndex[encodingIndex - FixedIndexes.End];
            }

            if (typeof encoding.encodes === "symbol") {
                targetArray[i] = encoding.encodes;
                continue;
            }
            const protoEnc = encoding as PrototypeEncoding;
            ctx.metadata = metadata[i];
            ctx.self = protoEnc;
            ctx.state = undefined;
            targetArray[i] = protoEnc.decoder.create(cur, ctx);
            if (ctx.state !== undefined) {
                states.set(i, ctx.state);
            }
            embedTrace(targetArray[i], protoEnc.key);
            ctx.self = null!;
            if (protoEnc.decoder.init) {
                needToInit.set(i, protoEnc);
            }
        }

        ctx.next();

        for (const key of needToInit.keys()) {
            const encoding = needToInit.get(key)!;
            ctx.state = states.get(key);
            ctx.metadata = metadata[key];
            ctx.self = encoding;
            encoding.decoder.init!(
                targetArray[key],
                input[key] as EncodedEntity,
                ctx
            );
            ctx.self = null!;
        }
        return targetArray[root];
    }

    encode(root: any): PreszrOutput {
        const tryScalar = tryEncodeScalar(root);
        if (tryScalar !== noResultPlaceholder) {
            return tryScalar;
        }
        const ctx = new EncodeCtx(this._store);
        const ref = ctx.encode(root) as string;
        const result = ctx.finish(ref);
        return result as PreszrOutput;
    }
}

export const defaultConfig: PreszrConfig<never[]> = {
    encodes: []
};

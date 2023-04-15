import { Encoding, PreszrConfig, PrototypeEncoding } from "./interface";
import { getUnrecognizedSymbol, isNumeric, version } from "./utils";
import {
    badType,
    EncodedEntity,
    noResultPlaceholder,
    PreszrFormat,
    PreszrOutput,
    tryDecodeScalar,
    tryEncodeScalar,
    unknownScalar
} from "./data";
import { arrayEncoding, getDefaultStore, objectEncoding } from "./encodings";
import { EncodeCtx } from "./encode/encode-context";
import { FixedIndexes } from "./encodings/fixed-indexes";
import { DecodeContext } from "./encode/decode-context";
import { getErrorByCode } from "./errors/texts";

/**
 * The class used to encode and decode things in the preszr format.
 */
export class Preszr {
    private _store = getDefaultStore();

    constructor(config?: Partial<PreszrConfig>) {
        if (config && typeof config !== "object") {
            throw getErrorByCode("config/bad-type")(config);
        }
        config ??= defaultConfig;
        if (config.encodes && !Array.isArray(config.encodes)) {
            throw getErrorByCode("config/encodes/not-array")(config.encodes);
        }

        this._store.add(...(config.encodes ?? []));
    }

    private _checkInputHeader(input: PreszrFormat) {
        let versionInfo = "" as any;
        if (!Array.isArray(input)) {
            throw getErrorByCode("decode/input/not-array")(input);
        } else {
            const header = input?.[0];

            if (!header) {
                throw getErrorByCode("decode/input/empty-array")();
            } else if (!Array.isArray(header)) {
                throw getErrorByCode("decode/input/bad-header")(header);
            } else {
                versionInfo = header[0];
                if (versionInfo == null) {
                    throw getErrorByCode("decode/input/header/empty-array")();
                } else if (typeof versionInfo !== "string") {
                    throw getErrorByCode("decode/input/version/not-string")(
                        versionInfo
                    );
                } else if (!isNumeric(versionInfo)) {
                    throw getErrorByCode("decode/input/version/not-numeric")(
                        versionInfo
                    );
                } else if (versionInfo !== version) {
                    throw getErrorByCode("decode/input/version/mismatch")(
                        versionInfo,
                        version
                    );
                } else if (!Array.isArray(header[1])) {
                    throw getErrorByCode("decode/input/header/no-keys")();
                } else if (
                    typeof header[2] !== "object" ||
                    !header[2] ||
                    Array.isArray(header[2])
                ) {
                    throw getErrorByCode("decode/input/header/no-map")();
                } else if (
                    typeof header[3] !== "object" ||
                    !header[3] ||
                    Array.isArray(header[2])
                ) {
                    throw getErrorByCode("decode/input/header/no-metadata")();
                } else if (typeof header[4] !== "number") {
                    throw getErrorByCode("decode/input/header/no-root")();
                } else if (header.length > 5) {
                    throw getErrorByCode("decode/input/header/too-long")(
                        header
                    );
                } else if (input.length === 1) {
                    throw getErrorByCode("decode/input/no-data")();
                }
            }
        }
    }

    decode(input: PreszrOutput): any {
        if (typeof input !== "object" || input === null) {
            const tryScalar = tryDecodeScalar(input);
            switch (tryScalar) {
                case noResultPlaceholder:
                    break;
                case badType:
                    throw getErrorByCode("decode/input/bad-type")(input);
                case unknownScalar:
                    throw getErrorByCode("decode/input/unknown-scalar")(input);
                default:
                    return tryScalar;
            }
        }

        input = input as PreszrFormat;
        // We check the header is in Preszr format.
        this._checkInputHeader(input);
        // Deconstruct the header to its parts
        const [[, encodingKeys, encodingSpec, metadata, root]] = input;
        const targetArray = Array(input.length - 1);
        const needToInit = new Map<number, PrototypeEncoding>();
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
            targetArray[i] = protoEnc.decoder.create(cur, ctx);
            ctx.self = null!;
            if (protoEnc.decoder.init) {
                needToInit.set(i, protoEnc);
            }
        }

        ctx.next();

        for (const key of needToInit.keys()) {
            const encoding = needToInit.get(key)!;
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
        return result;
    }
}

export const defaultConfig: PreszrConfig = {
    encodes: []
};

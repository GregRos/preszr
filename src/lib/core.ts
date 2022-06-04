import {
    DeepPartial,
    Encoding,
    EncodingSpecifier,
    PreszrConfig,
    PrototypeEncoding,
    SymbolSpecifier
} from "./interface";
import {
    cloneDeep,
    defaultsDeep,
    getUnrecognizedSymbol,
    version
} from "./utils";
import {
    EncodedEntity,
    noResultPlaceholder,
    PreszrFormat,
    PreszrOutput,
    tryDecodeScalar,
    tryEncodeScalar
} from "./data";
import { arrayEncoding, builtinEncodings, objectEncoding } from "./encodings";
import { PreszrError } from "./errors";
import { EncodingStore } from "./encode/store";
import { EncodeCtx } from "./encode/encode-context";
import { Fixed } from "./encodings/fixed";
import { DecodeContext } from "./encode/decode-context";

/**
 * The class used to encode and decode things in the preszr format.
 */
export class Preszr {
    private _store = new EncodingStore();

    constructor(config?: Partial<PreszrConfig>) {
        config ??= defaultConfig;
        this._store.add(...builtinEncodings, ...(config.encodes ?? []));
    }

    private _checkInputHeader(input: PreszrFormat) {
        let reason = "" as string;
        let versionInfo = "" as any;
        if (!Array.isArray(input)) {
            reason = "input is not array";
        } else {
            const header = input?.[0];

            if (!header) {
                reason = "no header element";
            } else if (!Array.isArray(header)) {
                reason = "header element is not array";
            } else {
                versionInfo = header[0];
                if (versionInfo == null) {
                    reason = "no version info";
                } else if (typeof versionInfo !== "string") {
                    reason = "version is not string";
                } else if (+versionInfo !== parseInt(versionInfo)) {
                    reason = "version is not numeric";
                } else if (versionInfo !== version) {
                    throw new PreszrError(
                        "Decoding",
                        `Input was encoded using version ${versionInfo}, but preszr is version ${version}. Set skipValidateVersion to allow this.`
                    );
                } else if (!Array.isArray(header[1])) {
                    reason = "no encoding keys or encoding keys not an array";
                } else if (typeof header[2] !== "object" || !header[1]) {
                    reason =
                        "no encoding data or encoding data is not an object";
                } else if (typeof header[3] !== "object" || !header[2]) {
                    reason =
                        "no custom metadata or custom metadata is not an object";
                } else if (input.length === 1) {
                    reason = "input must have at least 2 elements";
                }
            }
        }
        if (reason) {
            throw new PreszrError(
                "Decoding",
                `Input is not preszr-encoded: ${reason}`
            );
        }
    }

    decode(input: PreszrOutput): any {
        const tryScalar = tryDecodeScalar(input);
        if (tryScalar !== noResultPlaceholder) return tryScalar;
        input = input as PreszrFormat;
        // We check the header is in Preszr format.
        this._checkInputHeader(input);
        // Deconstruct the header to its parts
        const [[, encodingKeys, encodingSpec, metadata]] = input;
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
                    encoding = arrayEncoding;
                } else {
                    encoding = objectEncoding;
                }
            } else if (encodingIndex < Fixed.End) {
                encoding = this._store.mustGetByIndex(encodingIndex);
            } else {
                encoding = encodingByIndex[encodingIndex - Fixed.End];
            }
            if (encodingIndex === Fixed.UnrecognizedSymbol) {
                targetArray[i] = getUnrecognizedSymbol(metadata[i] as string);
                continue;
            }
            if ("symbol" in encoding) {
                targetArray[i] = encoding.symbol;
                continue;
            }
            const protoEnc = encoding as PrototypeEncoding;
            ctx.metadata = metadata[i];
            targetArray[i] = protoEnc.decoder.create(cur, ctx);
            if (protoEnc.decoder.init) {
                needToInit.set(i, protoEnc);
            }
        }

        ctx.next();

        for (const key of needToInit.keys()) {
            const encoding = needToInit.get(key)!;
            ctx.metadata = metadata[key];
            encoding.decoder.init!(
                targetArray[key],
                input[key] as EncodedEntity,
                ctx
            );
        }
        return targetArray[1];
    }

    encode(root: any): PreszrOutput {
        const tryScalar = tryEncodeScalar(root);
        if (tryScalar !== noResultPlaceholder) {
            return tryScalar;
        }
        const ctx = new EncodeCtx(this._store);
        ctx.encode(root);
        const result = ctx.finish();
        return result;
    }
}

export const defaultConfig: PreszrConfig = {
    encodes: [],
    unsupported: []
};

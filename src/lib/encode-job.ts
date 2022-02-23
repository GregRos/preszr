import {
    DeepPartial,
    EncodeContext,
    Encoding,
    EncodingSpecifier,
    InitContext,
    PreszrConfig,
    PrototypeEncoding,
    SymbolEncoding
} from "./interface";
import { defaultsDeep, getSymbolName, getUnrecognizedSymbol, version } from "./utils";
import {
    EncodedEntity,
    EncodingSpec,
    Entity,
    Header,
    Metadata,
    noResultPlaceholder,
    PreszrFormat,
    PreszrOutput,
    Reference,
    ScalarValue,
    tryDecodeScalar,
    tryEncodeScalar,
    unrecognizedSymbolKey
} from "./data";
import {
    arrayEncoding,
    builtinEncodings,
    getUnsupportedEncoding,
    nullPlaceholder,
    objectEncoding
} from "./encodings";
import { PreszrError } from "./errors";
import { mustParseEncodingKey } from "./encodings/utils";
import { unsupportedTypes } from "./unsupported";
import { WorkingEncodingCache } from "./encodings/cache";
import { EncodingStore } from "./encodings/encoding-store";

/**
 * The class used to encode and decode things in the preszr format.
 */
export class PreszrJob {
    constructor(private _cache: WorkingEncodingCache) {

    }

    private _findEncodingByKeyValue(input: unknown, encodingKey: string) {
        if (encodingKey != null) {
            const encoding = this._cache.
            return encoding;
        }
        if (Array.isArray(input)) {
            return arrayEncoding;
        }
        return objectEncoding;
    }

    private _checkInputHeader(input: any) {
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
                        `Input was encoded using version ${versionInfo}, but preszr is version ${version}. Set skipValidateVersion to allow this.`
                    );
                } else if (!Array.isArray(header[1])) {
                    reason = "no encoding keys or encoding keys not an array";
                } else if (typeof header[2] !== "object" || !header[1]) {
                    reason = "no encoding data or encoding data is not an object";
                } else if (typeof header[3] !== "object" || !header[2]) {
                    reason = "no custom metadata or custom metadata is not an object";
                } else if (input.length === 1) {
                    reason = "input must have at least 2 elements";
                }
            }
        }
        if (reason) {
            throw new PreszrError(`Input is not preszr-encoded: ${reason}`);
        }
    }

    decode(input: PreszrOutput): any {
        const tryScalar = tryDecodeScalar(input);
        if (tryScalar !== noResultPlaceholder) return tryScalar;
        input = input as PreszrFormat;
        // We check the header is in Preszr format.
        this._checkInputHeader(input);
        const header = input?.[0];
        // Deconstruct the header to its parts
        const [, encodingKeys, encodingSpec, metadata] = header;
        const targetArray = Array(input.length - 1);
        const needToInit = new Map<number, PrototypeEncoding>();
        // For optimization purposes, create one instance of `InitContext`.
        const ctx: InitContext = {
            decode: null!,
            metadata: undefined
        };

        // Check all encoding keys are present.
        for (const encodingKey of encodingKeys) {
            this._cache.mustGetByKey(encodingKey);
        }

        // Start decoding the payload.
        for (let i = 1; i < input.length; i++) {
            const encodingIndex = encodingSpec[i];
            const encodingKey = encodingKeys[encodingIndex];
            const cur = input[i] as EncodedEntity;
            if (encodingKey === unrecognizedSymbolKey) {
                targetArray[i] = getUnrecognizedSymbol(metadata[i] as string);
                continue;
            }
            if (encodingKey == null && typeof cur === "string") {
                targetArray[i] = cur;
                continue;
            }
            const encoding = this._findEncodingByKeyValue(cur, encodingKey);
            if ("symbol" in encoding) {
                targetArray[i] = encoding.symbol;
                continue;
            }
            ctx.metadata = metadata[i];
            targetArray[i] = encoding.decoder.create(cur, ctx);
            if (encoding.decoder.init) {
                needToInit.set(i, encoding);
            }
        }

        ctx.decode = (value: any) => {
            const decodedPrimitive = tryDecodeScalar(value);
            if (decodedPrimitive !== noResultPlaceholder) {
                return decodedPrimitive;
            }
            return targetArray[value];
        };
        for (const key of needToInit.keys()) {
            const encoding = needToInit.get(key)!;
            ctx.metadata = metadata[key];
            encoding.decoder.init!(targetArray[key], input[key] as EncodedEntity, ctx);
        }
        return targetArray[1];
    }

    encode(root: any): PreszrOutput {
        try {
            const tryScalar = tryEncodeScalar(root);
            if (tryScalar !== noResultPlaceholder) return tryScalar;
            const encodingSpec = {} as EncodingSpec;
            const metadata = {} as Metadata;
            const encodingKeys = new Map<string, number>();
            const header = [] as unknown as Header;

            const preszrRep = [header] as PreszrFormat;
            const objectToRef = new Map<object | symbol | string, Reference>();

            const cacheEncodingIndex = (key: string) => {
                let encodingIndex = encodingKeys.get(key);
                if (encodingIndex == null) {
                    encodingIndex = encodingKeys.size;
                    encodingKeys.set(key, encodingIndex);
                }
                return encodingIndex;
            };
            const ctx: EncodeContext = {
                metadata: undefined,
                encode(value: any): ScalarValue {
                    const tryScalar = tryEncodeScalar(value);
                    if (tryScalar !== noResultPlaceholder) return tryScalar;
                    let existingRef = objectToRef.get(value);
                    if (!existingRef) {
                        existingRef = createNewRef(value);
                    }
                    return existingRef;
                }
            };
            const createNewRef = (value: Entity): Reference => {
                const index = preszrRep.length;
                const ref = `${index}`;
                objectToRef.set(value, ref);
                if (typeof value === "string") {
                    preszrRep.push(value);
                    return ref;
                }
                preszrRep.push(0);
                if (typeof value === "symbol") {
                    const encoding = this._findEncodingForSymbol(value);
                    encodingSpec[index] = cacheEncodingIndex(encoding.name);
                    if (encoding.metadata) {
                        metadata[index] = encoding.metadata;
                    }
                    return ref;
                }
                const encoding = this._findEncodingForObject(value);
                const oldMetadata = ctx.metadata;
                const szed = encoding.encode(value, ctx);
                if (!(ctx as any)._isImplicit) {
                    encodingSpec[index] = cacheEncodingIndex(encoding.name);
                }
                (ctx as any)._isImplicit = false;
                if (ctx.metadata !== undefined) {
                    metadata[index] = ctx.metadata;
                }
                ctx.metadata = oldMetadata;
                preszrRep[index] = szed;
                return ref;
            };
            ctx.encode(root);
            header.push(version, [...encodingKeys.keys()], encodingSpec, metadata);
            return preszrRep;
        } finally {
            this._tempSymbEncoding.clear();
        }
    }
}

export const defaultConfig: PreszrConfig = {
    encodings: [],
    unsupported: []
};

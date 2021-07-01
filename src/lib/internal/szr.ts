import {
    DeepPartial,
    EncodeContext,
    SzrConfig,
    SzrPrototypeEncoding,
    SzrEncodingSpecifier,
    SzrEncoding,
    SzrSymbolEncoding,
    DecodeInitContext
} from "./szr-interface";
import {
    defaultsDeep, getLibraryString, getSymbolName, getUnrecognizedSymbol,
    version
} from "./utils";
import {
    SzrLeaf,
    Reference,
    SzrHeader,
    SzrOutput,
    SzrFormat,
    SzrEncodingInformation,
    SzrMetadata,
    SzrEntity,
    SzrPrimitive,
    tryEncodeScalar,
    tryDecodeScalar,
    undefinedEncoding,
    noResultPlaceholder, unrecognizedSymbolKey, SzrEncodedEntity
} from "./szr-representation";
import {
    ArrayEncoding, getUnsupportedEncoding, nullPlaceholder,
    NullPrototypeEncoding,
    ObjectEncoding, unsupportedEncodingKey
} from "./encodings/basic";
import {createFundamentalObjectEncoding, dateEncoding, regexpEncoding} from "./encodings/scalar";
import {SzrError} from "./errors";
import {ArrayBufferEncoding, typedArrayEncodings} from "./encodings/binary";
import {MapEncoding, SetEncoding} from "./encodings/collections";
import {errorEncodings} from "./encodings/built-in";
import {getFullEncoding} from "./encoding-constructors";


const builtinEncodings = [
    ObjectEncoding,
    ArrayEncoding,
    NullPrototypeEncoding,
    createFundamentalObjectEncoding(Number),
    createFundamentalObjectEncoding(Boolean),
    createFundamentalObjectEncoding(String),
    dateEncoding,
    regexpEncoding,
    ...typedArrayEncodings,
    ArrayBufferEncoding,
    MapEncoding,
    SetEncoding,
    ...errorEncodings
] as SzrEncodingSpecifier[];

const builtinUnsupportedTypes = [
    WeakMap.prototype,
    WeakSet.prototype,
    Function.prototype
];

export class Szr {
    private _config = defaultConfig;
    private _keyToEncoding = new Map<string, SzrEncoding>();
    private _symbToEncoding = new Map<symbol, SzrSymbolEncoding>();
    private _tempSymbEncoding = new Map<symbol, SzrSymbolEncoding>();
    private _protoEncodingCache = new WeakMap<object, SzrPrototypeEncoding>();
    private _protoEncodings = [] as SzrPrototypeEncoding[];

    constructor(config?: DeepPartial<SzrConfig>) {
        this._config = defaultsDeep({}, config, this._config);
        const unsupportedEncoding = getUnsupportedEncoding(
            ...builtinUnsupportedTypes,
            ...this._config.unsupported,
        );
        this.addEncoding(...builtinEncodings, unsupportedEncoding, ...this._config.encodings);
    }

    private _buildEncodingCache() {
        this._protoEncodingCache = new WeakMap<object, SzrPrototypeEncoding>();
        for (const encoding of this._protoEncodings) {
            for (const proto of encoding.prototypes) {
                this._protoEncodingCache.set(proto, encoding);
            }
        }
    }

    addEncoding(...encoders: SzrEncodingSpecifier[]) {
        for (const encSpecifier of encoders) {
            const encoding = getFullEncoding(encSpecifier);
            if (this._keyToEncoding.get(encoding.key)) {
                throw new SzrError(`Encoding with the key '${encoding.key}' already exists.`);
            }
            if ("prototypes" in encoding) {
                this._protoEncodings.push(encoding);
            } else {
                this._symbToEncoding.set(encoding.symbol, encoding);
            }
            this._keyToEncoding.set(encoding.key, encoding);
        }
        this._buildEncodingCache();
    }

    private _findEncodingForObject(obj: object) {
        if (Array.isArray(obj)) {
            return ArrayEncoding;
        }
        let foundEncoding: SzrPrototypeEncoding;
        for (let proto = obj;; proto = Object.getPrototypeOf(proto) ?? nullPlaceholder) {
            const cached = this._protoEncodingCache.get(proto);
            if (cached !== undefined) {
                foundEncoding = cached;
                break;
            }
            if (proto === nullPlaceholder) {
                throw new SzrError("FindEncodingForObject got stuck. Internal Error.");
            }
        }
        foundEncoding ??= ObjectEncoding;
        if (!this._protoEncodingCache.has(obj)) {
            this._protoEncodingCache.set(obj, foundEncoding);
        }
        return foundEncoding;
    }

    private _findEncodingForSymbol(symb: symbol): SzrSymbolEncoding {
        let encoding = this._symbToEncoding.get(symb) ?? this._tempSymbEncoding.get(symb);
        if (encoding == null) {
            encoding = {
                symbol: symb,
                key: unrecognizedSymbolKey,
                metadata: getSymbolName(symb) || `#${this._symbToEncoding.size + 1}`
            };
            this._tempSymbEncoding.set(symb, encoding);
        }
        return encoding;
    }

    private _findEncodingByKeyValue(input: any, encodingKey: string) {
        if (encodingKey != null) {
            const encoding = this._keyToEncoding.get(encodingKey);
            if (!encoding) {
                throw new SzrError(`Encoding with key '${encodingKey}' not found. Szr wasn't configured correctly.`);
            }
            return encoding;
        }
        if (Array.isArray(input)) {
            return ArrayEncoding;
        }
        return ObjectEncoding;
    }

    private _checkInputValid(input) {
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
                } else if (typeof header[1] !== "object" || !header[1]) {
                    reason = "no encoding data or encoding data is not an object";
                } else if (typeof header[2] !== "object" || !header[2]) {
                    reason = "no custom metadata or custom metadata is not an object";
                } else if (input.length === 1) {
                    reason = "input must have at least 2 elements";
                }
            }
        }
        if (reason) {
            throw new SzrError(`Input is not szr-encoded: ${reason}`);
        }
        if (versionInfo !== version && !this._config.options.skipValidateVersion) {
            throw new SzrError(`Input was encoded using version ${versionInfo}, but szr is version ${version}. Set skipValidateVersion to allow this.`);
        }
    }

    decode(input: SzrOutput): any {
        const tryScalar = tryDecodeScalar(input);
        if (tryScalar !== noResultPlaceholder) return tryScalar;
        input = input as SzrFormat;
        const header = input?.[0];
        const {options} = this._config;
        this._checkInputValid(input);
        const encodingInfo = header[1] as SzrEncodingInformation;
        const metadata = header[2] as SzrMetadata;
        const targetArray = Array(input.length - 1);
        const needToInit = new Map<number, SzrPrototypeEncoding>();
        const ctx: DecodeInitContext = {
            decode: null!,
            metadata: undefined,
            options
        };

        for (let i = 1; i < input.length; i++) {
            const encodingKey = encodingInfo[i];
            let cur = input[i] as SzrEncodedEntity;
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
            if (decodedPrimitive !== noResultPlaceholder) return decodedPrimitive;
            return targetArray[value];
        };
        for (let key of needToInit.keys()) {
            const encoding = needToInit.get(key)!;
            ctx.metadata = metadata[key];
            encoding.decoder.init!(targetArray[key], input[key] as SzrEncodedEntity, ctx);
        }
        return targetArray[1];
    }


    encode(root: any): SzrOutput {
        try {
            const tryScalar = tryEncodeScalar(root);
            if (tryScalar !== noResultPlaceholder) return tryScalar;
            let encodingInfo = {} as SzrEncodingInformation;
            let metadata = {} as SzrMetadata;
            const options = this._config.options;
            const header = [
                version,
                encodingInfo,
                metadata
            ] as SzrHeader;

            const szrRep = [header] as SzrFormat;
            const objectToRef = new Map<object | symbol, Reference>();
            const ctx: EncodeContext = {
                options,
                metadata: undefined,
                encode(value: any): SzrLeaf {
                    if (typeof value === "string") {
                        return createNewRef(value);
                    }
                    const tryScalar = tryEncodeScalar(value);
                    if (tryScalar !== noResultPlaceholder) return tryScalar;
                    let existingRef = objectToRef.get(value);
                    if (!existingRef) {
                        existingRef = createNewRef(value);
                    }
                    return existingRef;
                }
            };
            const createNewRef = <T>(value: SzrEntity): Reference => {
                const index = szrRep.length;
                const ref = `${index}`;
                if (typeof value === "string") {
                    szrRep.push(value);
                    return ref;
                }

                szrRep.push(0);
                objectToRef.set(value, ref);
                if (typeof value === "symbol") {
                    const encoding = this._findEncodingForSymbol(value);
                    encodingInfo[index] = encoding.key;
                    if (encoding.metadata) {
                        metadata[index] = encoding.metadata;
                    }
                    return ref;
                }
                const handler = this._findEncodingForObject(value);
                const oldMetadata = ctx.metadata;
                const szed = handler.encode(value, ctx);
                if (!(ctx as any)._isImplicit) {
                    encodingInfo[index] = handler.key;
                }
                (ctx as any)._isImplicit = false;
                if (ctx.metadata !== undefined) {
                    metadata[index] = ctx.metadata;
                }
                ctx.metadata = oldMetadata;
                szrRep[index] = szed;
                return ref;
            };
            ctx.encode(root);
            return szrRep;
        } finally {
            this._tempSymbEncoding.clear();
        }

    }
}

export const defaultConfig: SzrConfig = {
    options: {
        alsoNonEnumerable: false,
        skipValidateVersion: false,
        custom: {}
    },
    encodings: [],
    unsupported: []
};


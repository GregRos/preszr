import {
    DeepPartial,
    LegalValue,
    EncodeContext,
    SzrConfig,
    SzrPrototypeEncoding,
    SzrEncodingSpecifier,
    SzrEncoding,
    SzrSymbolEncoding,
    getFullEncoding, DecodeInitContext
} from "./szr-interface";
import {
    defaultsDeep, getLibraryString, getSymbolName, getUnrecognizedSymbol,
    version
} from "./utils";
import {
    Leaf,
    Reference,
    SzrMetadata,
    SzrOutput,
    SzrRepresentation,
    SzrEncodingInformation,
    SzrCustomMetadata,
    SzrEntity,
    SzrPrimitive,
    tryEncodeScalar,
    tryDecodeScalar,
    undefinedEncoding,
    noResultPlaceholder, unrecognizedSymbolKey
} from "./szr-representation";
import {
    arrayEncoding, getUnsupportedEncoding, nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding, unsupportedEncodingKey
} from "./encodings/basic";
import {createFundamentalObjectEncoding, dateEncoding, regexpEncoding} from "./encodings/scalar";
import {SzrError} from "./errors";
import {arrayBufferEncoding, typedArrayEncodings} from "./encodings/binary";
import {mapEncoding, setEncoding} from "./encodings/collections";
import {errorEncodings} from "./encodings/built-in";


const builtinEncodings = [
    objectEncoding,
    arrayEncoding,
    nullPrototypeEncoding,
    createFundamentalObjectEncoding(Number),
    createFundamentalObjectEncoding(Boolean),
    createFundamentalObjectEncoding(String),
    dateEncoding,
    regexpEncoding,
    ...typedArrayEncodings,
    arrayBufferEncoding,
    mapEncoding,
    setEncoding,
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
        this.addEncoding(...this._config.encodings, ...builtinEncodings, unsupportedEncoding);
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
            return arrayEncoding;
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
        foundEncoding ??= objectEncoding;
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
            return arrayEncoding;
        }
        return objectEncoding;
    }

    private _checkInputValid(input) {
        let reason = "" as string;
        let versionInfo = "" as any;
        if (!Array.isArray(input)) {
            reason = "input is not array";
        } else {
            const metadata = input?.[0];

            if (!metadata) {
                reason = "no metadata element";
            } else if (!Array.isArray(metadata)) {
                reason = "metadata element is not array";
            } else {
                versionInfo = metadata[0];
                if (versionInfo == null) {
                    reason = "no version info";
                } else if (typeof versionInfo !== "string") {
                    reason = "version is not string";
                } else if (+versionInfo !== parseInt(versionInfo)) {
                    reason = "version is not numeric";
                } else if (typeof metadata[1] !== "object" || !metadata[1]) {
                    reason = "no encoding data or encoding data is not an object";
                } else if (typeof metadata[2] !== "object" || !metadata[2]) {
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

    decode(input: any): any {
        const tryScalar = tryDecodeScalar(input);
        if (tryScalar !== noResultPlaceholder) return tryScalar;
        const metadata = input?.[0];
        const {options} = this._config;
        this._checkInputValid(input);

        const encodingInfo = metadata[1] as SzrEncodingInformation;
        const customMetadata = metadata[2] as SzrCustomMetadata;
        const targetArray = Array(input.length - 1);
        const needToInit = new Map<number, SzrPrototypeEncoding>();
        const ctx: DecodeInitContext = {
            deref: null!,
            metadata: undefined,
            options
        };

        for (let i = 1; i < input.length; i++) {
            const encodingKey = encodingInfo[i];
            let cur = input[i];
            if (encodingKey === unrecognizedSymbolKey) {
                targetArray[i] = getUnrecognizedSymbol(customMetadata[i]);
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
            ctx.metadata = customMetadata[i];
            targetArray[i] = encoding.decoder.create(cur, ctx);
            if (encoding.decoder.init) {
                needToInit.set(i, encoding);
            }
        }

        ctx.deref = (value: any) => {
            const decodedPrimitive = tryDecodeScalar(value);
            if (decodedPrimitive !== noResultPlaceholder) return decodedPrimitive;
            return targetArray[value];
        };
        for (let key of needToInit.keys()) {
            const encoding = needToInit.get(key)!;
            ctx.metadata = customMetadata[key];
            encoding.decoder.init!(targetArray[key], input[key], ctx);
        }
        return targetArray[1];
    }


    encode(root: SzrEntity | SzrPrimitive | undefined | bigint): SzrOutput {
        try {
            const tryScalar = tryEncodeScalar(root);
            if (tryScalar !== noResultPlaceholder) return tryScalar;
            let encodingInfo = {} as SzrEncodingInformation;
            let customMetadata = {} as SzrCustomMetadata;
            const options = this._config.options;
            const metadataArray = [
                version,
                encodingInfo,
                customMetadata
            ] as SzrMetadata;

            const szrRep = [metadataArray] as SzrRepresentation;
            const objectToRef = new Map<object | symbol, Reference>();
            const ctx: EncodeContext = {
                options,
                metadata: undefined,
                ref(value: any): Leaf {
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
            const createNewRef = (value: SzrEntity): Reference => {
                const index = szrRep.length;
                const ref = `${index}` as Reference;
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
                        customMetadata[index] = encoding.metadata;
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
                    customMetadata[index] = ctx.metadata;
                }
                ctx.metadata = oldMetadata;
                szrRep[index] = szed;
                return ref;
            };
            ctx.ref(root);
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


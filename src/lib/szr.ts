import {
    DeepPartial,
    LegalValue,
    EncodeContext,
    SzrConfig,
    SzrPrototypeEncoding,
    SzrEncodingSpecifier,
    SzrEncoding,
    SzrSymbolEncoding,
    getPrototypeEncoding, DecodeInitContext
} from "./szr-interface";
import {
    defaultsDeep, getEncodedString, getRandomizedEncodedString,
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
    isDecodedScalar,
    noResultPlaceholder
} from "./szr-representation";
import {
    arrayEncoding, getUnsupportedEncoding, nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding
} from "./encodings/basic";
import {createFundamentalObjectEncoding} from "./encodings/scalar";
import {SzrError} from "./errors";


const builtinEncodings = [
    objectEncoding,
    arrayEncoding,
    nullPrototypeEncoding,
    createFundamentalObjectEncoding(Number),
    createFundamentalObjectEncoding(Boolean),
    createFundamentalObjectEncoding(String)
] as SzrEncodingSpecifier[];

const bigintKey = getEncodedString("bigint");

const builtinUnsupportedTypes = [
    WeakMap.prototype,
    WeakSet.prototype,
    Function.prototype
];

export class Szr {
    private _config = defaultConfig;
    private _keyToEncoding = new Map<string, SzrEncoding>();
    private _symbToEncoding = new Map<symbol, SzrSymbolEncoding>();
    private _protoEncodingCache = new WeakMap<object, SzrPrototypeEncoding>();
    private _protoEncodings = [] as SzrPrototypeEncoding[];

    constructor(config?: DeepPartial<SzrConfig>) {
        this._config = defaultsDeep(config, this._config);
        const unsupportedEncoding = getUnsupportedEncoding(
            ...builtinUnsupportedTypes,
            ...this._config.unsupported
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
            const encoding = "symbol" in encSpecifier ? encSpecifier : getPrototypeEncoding(encSpecifier);
            if (this._keyToEncoding.get(encoding.key)) {
                throw new SzrError(`Encoding with the key '${encoding.key}' already exists.`);
            }
            if ("prototypes" in encoding) {
                this._protoEncodings.push(encoding);

            } else {
                if (this._symbToEncoding.has(encoding.symbol)) {
                    throw new SzrError(`Symbol ${String(encoding.symbol)} already has an assigned encoding.`);
                }
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
        }
        foundEncoding ??= objectEncoding;
        if (!this._protoEncodingCache.has(obj)) {
            this._protoEncodingCache.set(obj, foundEncoding);
        }
        return foundEncoding;
    }

    private _findEncodingForSymbol(symb: symbol): SzrSymbolEncoding {
        const encoding = this._symbToEncoding.get(symb);
        if (encoding == null) {
            throw new SzrError(`Unrecognized symbol ${String(symb)}`);
        }
        return encoding;
    }

    private _findEncodingByKeyValue(input: any, encodingKey: string) {
        if (encodingKey != null) {
            return this._keyToEncoding.get(encodingKey)!;
        }
        if (Array.isArray(input)) {
            return arrayEncoding;
        }
        return objectEncoding;
    }

    decode(input: any): any {
        const tryScalar = tryDecodeScalar(input);
        if (tryScalar !== noResultPlaceholder) return tryScalar;
        const metadata = input?.[0];
        const inputVersion = metadata?.[0];
        const {options} = this._config;
        if (!Array.isArray(metadata) || inputVersion == null || +inputVersion !== parseInt(inputVersion) || input.length === 1) {
            throw new SzrError("Input is not szr-encoded.");
        }
        if (inputVersion !== version && !options.skipValidateVersion) {
            throw new SzrError(`Input was encoded using version ${inputVersion}, but szr is version ${version}`);
        }

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
            if (typeof cur === "string") {
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
                return ref;
            }
            const handler = this._findEncodingForObject(value);
            const oldMetadata = ctx.metadata;
            const szed = handler.encode(value, ctx);
            if (!(ctx as any)._isImplicit) {
                encodingInfo[index] = handler.key;
            }
            if (ctx.metadata !== undefined) {
                customMetadata[index] = ctx.metadata;
            }
            ctx.metadata = oldMetadata;
            szrRep[index] = szed;
            return ref;
        };
        ctx.ref(root);

        return szrRep;
    }
}

export const defaultConfig: SzrConfig = {
    options: {
        alsoNonEnumerable: false,
        errorOnUnknownClass: false,
        skipValidateVersion: false,
        alsoSymbolKeys: false,
        custom: {}
    },
    encodings: [],
    unsupported: []
};


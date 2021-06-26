import {
    DeepPartial,
    LegalValue,
    EncodeContext,
    SzrConfig,
    SzrError,
    SzrPrototypeEncoding,
    SzrEncodingSpecifier,
    SzrEncoding,
    SzrSymbolEncoding,
    getPrototypeEncoding, DecodeInitContext
} from "./szr-interface";
import {
    defaultsDeep, getRandomizedEncodedString,
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
    encodeScalar, tryDecodeScalar, undefinedEncoding
} from "./szr-representation";
import {
    arrayEncoding, nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding
} from "./basic.encodings";
import {createFundamentalObjectEncoding} from "./built-in.encodings";


const builtinSerializers = [
    objectEncoding,
    arrayEncoding,
    nullPrototypeEncoding,
    createFundamentalObjectEncoding(Number),
    createFundamentalObjectEncoding(Boolean),
    createFundamentalObjectEncoding(String)
] as SzrEncodingSpecifier[];

export class Szr {
    private _config = defaultConfig;
    private _keyToEncoding = new Map<string, SzrEncoding>();
    private _objectToEncodingKey = new Map<object | symbol, string>();
    private _prototypeToEncodingCache = new WeakMap<object, string>();

    constructor(config?: DeepPartial<SzrConfig>) {
        this._config = defaultsDeep(config, this._config);
        for (const typeSpecifier of [...this._config.encodings, ...builtinSerializers]) {
            this.addEncoding(typeSpecifier);
        }
    }

    addEncoding(...encoders: SzrEncodingSpecifier[]) {
        for (const encSpecifier of encoders) {
            const encoding = "symbol" in encSpecifier ? encSpecifier : getPrototypeEncoding(encSpecifier);
            if (this._keyToEncoding.get(encoding.key)) {
                throw new SzrError(`Encoding with the key '${encoding.key}' already exists.`);
            }
            if ("prototype" in encoding) {
                if (this._objectToEncodingKey.has(encoding.prototype)) {
                    throw new SzrError(`Prototype ${encoding.prototype} already has an assigned encoding.`);
                }
                this._objectToEncodingKey.set(encoding.prototype, encoding.key);
            } else {
                if (this._objectToEncodingKey.has(encoding.symbol)) {
                    throw new SzrError(`Symbol ${String(encoding.symbol)} already has an assigned encoding.`);
                }
                this._objectToEncodingKey.set(encoding.symbol, encoding.key);
            }
            this._keyToEncoding.set(encoding.key, encoding);
        }
    }

    private _findPrototypeEncoding(obj: object) {
        const proto = Object.getPrototypeOf(obj) ?? nullPlaceholder;
        const handler = this._objectToEncodingKey.get(proto);

    }

    private _sourceToEncoding(obj: object): SzrPrototypeEncoding {
        if (Array.isArray(obj)) {
            return arrayEncoding;
        }
        const proto = Object.getPrototypeOf(obj) ?? nullPlaceholder;
        const cached = this._findPrototypeEncoding(obj);
        const handler = this._objectToEncodingKey.get(proto);
        if (handler == null) {
            return objectEncoding;
        }
        return this._keyToEncoding.get(handler) as SzrPrototypeEncoding;
    }

    private _symbolToEncodingKey(symb: symbol): string {
        const encodingKey = this._objectToEncodingKey.get(symb);
        if (encodingKey == null) {
            throw new SzrError(`Unrecognized symbol ${String(symb)}`);
        }
        return encodingKey;
    }

    private _findEncoding(target: any, encodingKey: string) {
        if (encodingKey != null) {
            return this._keyToEncoding.get(encodingKey)!;
        }
        if (Array.isArray(target)) {
            return arrayEncoding;
        }
        return objectEncoding;
    }

    decode(input: SzrOutput): any {
        if (input === undefinedEncoding) return undefined;
        if (typeof input === "boolean" || input === null || typeof input === "number") return input;
        const tryNumeric = tryDecodeScalar(input);
        if (tryNumeric != null) return tryNumeric;
        const metadata = input?.[0];
        const inputVersion = metadata?.[0];
        const {options} = this._config;
        if (inputVersion == null || +inputVersion !== parseInt(inputVersion)) {
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
            if (encodingKey == null && typeof cur === "string") {
                const tryNumeric = tryDecodeScalar(cur);
                targetArray[i] = tryNumeric ?? cur;
                continue;
            }
            const encoding = this._findEncoding(cur, encodingKey);
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

        ctx.deref = value => {
            if (value === undefinedEncoding) return undefined;
            const tryDecode = tryDecodeScalar(value);
            if (tryDecode != null) return tryDecode;
            if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
            return targetArray[value];
        };
        for (let key of needToInit.keys()) {
            const encoding = needToInit.get(key)!;
            ctx.metadata = customMetadata[key];
            encoding.decoder.init!(targetArray[key], input[key], ctx);
        }
        return targetArray[1];
    }


    encode(root: SzrEntity | SzrPrimitive | undefined): SzrOutput {
        if (root === undefined) return undefinedEncoding;
        if (typeof root === "number") return encodeScalar(root);
        if (root === null || typeof root === "boolean") return root;
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
            ref(value: LegalValue): Leaf {
                if (typeof value === "string") {
                    return createNewRef(value);
                }
                if (typeof value === "number") return encodeScalar(value);
                if (typeof value === "boolean" || value === null) return value;
                if (value === undefined) return undefinedEncoding;
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
                const encodingKey = this._symbolToEncodingKey(value);
                encodingInfo[index] = encodingKey;
                return ref;
            }
            const handler = this._sourceToEncoding(value);
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
    encodings: []
};


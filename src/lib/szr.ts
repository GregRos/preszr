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
    getPrototypeEncoding
} from "./szr-interface";
import {
    defaultsDeep,
    getRandomizedEncodedString,
    version
} from "./utils";
import {
    Leaf,
    Reference,
    SzrMetadata,
    SzrOutput,
    SzrRepresentation, SzrEncodingInformation,
    UndefinedEncoding, SzrCustomMetadata, SzrEntity, SzrPrimitive
} from "./szr-representation";
import {
    arrayEncoding, nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding
} from "./basic-serializers";

const undefinedEncoding: UndefinedEncoding = "0";

const builtinSerializers = [
    objectEncoding,
    arrayEncoding,
    nullPrototypeEncoding
] as SzrEncodingSpecifier[];

export class Szr {
    private _config = defaultConfig;
    private _keyToEncoding = new Map<string, SzrEncoding>();
    private _objectToEncodingKey = new Map<object | symbol, string>();
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

    private _objectToEncoding(obj: object): SzrPrototypeEncoding {
        if (Array.isArray(obj)) {
            return arrayEncoding;
        }
        const proto = Object.getPrototypeOf(obj) ?? nullPlaceholder;
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

    encode(root: SzrEntity | SzrPrimitive | undefined): SzrOutput {
        if (root === undefined) return undefinedEncoding;
        if (root === null || typeof root === "number" || typeof root === "boolean") return root;
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
                if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
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
            const handler = this._objectToEncoding(value);
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


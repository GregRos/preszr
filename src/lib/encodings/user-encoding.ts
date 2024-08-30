import {
    Decoder,
    EncodeContext,
    EncodeFunction,
    Encoder,
    PrototypeEncoding,
    PrototypeSpecifier
} from "../interface";
import { getPrototypeDecoder, getPrototypeEncoder } from "./objects";
import { wrapEncodeFunction } from "./utils";
import {
    config_encoding_badName,
    config_encoding_badVersion
} from "../errors/texts2";

const MAX_VERSION = 999;
const MIN_VERSION = 1;
export class UserEncoding<T extends object> extends PrototypeEncoding<T> {
    readonly encodes: T;
    readonly decoder: Decoder<T>;
    readonly name: string;
    readonly version: number;
    readonly encoder: Encoder<T>;

    constructor(
        specifier: PrototypeSpecifier<T> & { name: string; encodes: any },
        public readonly fixedIndex: number | undefined
    ) {
        super();
        this.name = specifier.name;
        this.version = specifier.version ?? 1;
        this.encodes = specifier.encodes;
        this.decoder = specifier.decoder ?? getPrototypeDecoder(this.encodes);
        this.encoder =
            wrapEncodeFunction(specifier.encode) ??
            getPrototypeEncoder(this.encodes);

        const { version, name } = this;
        if (
            typeof version !== "number" ||
            !Number.isInteger(version) ||
            version < 0 ||
            version > 999
        ) {
            throw config_encoding_badVersion(this, version);
        }

        if (name != null && typeof name !== "string") {
            throw config_encoding_badName(this);
        }
    }
}

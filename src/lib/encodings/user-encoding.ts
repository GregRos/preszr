import {
    Decoder,
    EncodeContext,
    PrototypeEncoding,
    PrototypeSpecifier
} from "../interface";
import { EncodedEntity } from "../data";
import { getPrototypeDecoder, getPrototypeEncoder } from "./objects";
import { getErrorByCode } from "../errors/texts";

const MAX_VERSION = 999;
const MIN_VERSION = 1;
export class UserEncoding<T extends object> extends PrototypeEncoding<T> {
    readonly encodes: T;
    readonly decoder: Decoder;
    readonly name: string;
    readonly version: number;
    readonly encode: (input: T, ctx: EncodeContext) => EncodedEntity;

    constructor(
        specifier: PrototypeSpecifier & { name: string; encodes: any },
        public readonly fixedIndex: number | undefined
    ) {
        super();
        this.name = specifier.name;
        this.version = specifier.version ?? 1;
        this.encodes = specifier.encodes;
        this.decoder = specifier.decoder ?? getPrototypeDecoder(this.encodes);
        this.encode = specifier.encode ?? getPrototypeEncoder(this.encodes);

        const { version, name } = this;
        if (typeof version !== "number") {
            throw getErrorByCode("config/proto/version/bad-type")(this);
        }
        if (typeof version !== "number" || !Number.isSafeInteger(version)) {
            throw getErrorByCode("config/proto/version/not-safe")(this);
        }
        if (version > MAX_VERSION || version < MIN_VERSION) {
            throw getErrorByCode("config/proto/version/bad-range")(
                [MIN_VERSION, MAX_VERSION],
                this
            );
        }
        if (name != null && typeof name !== "string") {
            throw getErrorByCode("config/spec/proto/bad-name")(name);
        }
    }
}

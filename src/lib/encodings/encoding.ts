import {
    Decoder,
    EncodeContext,
    EncodingSpecifier,
    PrototypeEncoding,
    PrototypeSpecifier
} from "../interface";
import { EncodedEntity } from "../data";
import { PreszrError } from "../errors";
import {
    getPrototypeDecoder,
    getPrototypeEncoder,
    nullPlaceholder
} from "./objects";
import { getProto } from "../utils";

export class UserEncoding<T extends object> extends PrototypeEncoding<T> {
    readonly encodes: T;
    readonly decoder: Decoder;
    readonly name: string;
    readonly version: number;
    readonly encode: (input: T, ctx: EncodeContext) => EncodedEntity;
    constructor(
        specifier: PrototypeSpecifier & { name: string },
        public readonly fixedIndex: number | undefined
    ) {
        super();
        if (specifier.encodes === undefined) {
            throw new PreszrError(
                "Configuration",
                "Encoding must specify a prototype."
            );
        }
        const proto =
            specifier.encodes === null
                ? nullPlaceholder
                : getProto(specifier.encodes);

        if (!proto) {
            throw new PreszrError(
                "Configuration",
                "Couldn't get prototype from constructor."
            );
        }
        this.name = specifier.name;
        this.version = specifier.version ?? 0;
        this.encodes = proto;
        this.decoder = specifier.decoder ?? getPrototypeDecoder(proto);
        this.encode = specifier.encode ?? getPrototypeEncoder(proto);
        this.validate();
    }
}

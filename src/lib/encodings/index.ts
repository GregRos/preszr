import {
    arrayEncoding,
    getUnsupportedEncoding,
    nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding
} from "./objects";
import { dateEncoding, regexpEncoding, wrapperEncodings } from "./scalar";
import {
    arrayBufferEncoding,
    sharedArrayBufferEncoding,
    typedArrayEncodings
} from "./binary";
import { mapEncoding, setEncoding } from "./collections";
import { errorEncodings } from "./errors";
import { PrototypeEncoding } from "../interface";
import { flatten } from "../utils";

export {
    arrayEncoding,
    getUnsupportedEncoding,
    nullPlaceholder,
    objectEncoding
};

export const builtinEncodings: PrototypeEncoding[] = [
    objectEncoding,
    arrayEncoding,
    nullPrototypeEncoding,
    ...wrapperEncodings,
    dateEncoding,
    regexpEncoding,
    ...typedArrayEncodings,
    arrayBufferEncoding,
    mapEncoding,
    setEncoding,
    ...errorEncodings,
    sharedArrayBufferEncoding
];

const builtInEncodingByProto = new Map(
    flatten(
        builtinEncodings.map(encoding =>
            encoding.protos.map(
                proto => [proto, encoding] as [object, PrototypeEncoding]
            )
        )
    )
);

export function getBuiltInEncoding(obj: object | null) {
    if (obj == null) {
        return builtInEncodingByProto.get(nullPlaceholder);
    }
    return builtInEncodingByProto.get(obj);
}

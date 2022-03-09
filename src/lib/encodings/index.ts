import {
    arrayEncoding,
    getUnsupportedEncoding,
    nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding
} from "./basic";
import {
    makeWrapperEncoding,
    dateEncoding,
    regexpEncoding,
    wrapperEncodings
} from "./scalar";
import {
    arrayBufferEncoding,
    sharedArrayBufferEncoding,
    typedArrayEncodings
} from "./binary";
import { mapEncoding, setEncoding } from "./collections";
import { errorEncodings } from "./errors";
import { EncodingSpecifier } from "../interface";

export {
    arrayEncoding,
    getUnsupportedEncoding,
    nullPlaceholder,
    objectEncoding
};

export const builtinEncodings = [
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
] as EncodingSpecifier[];

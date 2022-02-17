import {
    arrayEncoding,
    getUnsupportedEncoding,
    nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding
} from "./basic";
import { createFundamentalObjectEncoding, dateEncoding, regexpEncoding } from "./scalar";
import { arrayBufferEncoding, typedArrayEncodings } from "./binary";
import { mapEncoding, setEncoding } from "./collections";
import { errorEncodings } from "./errors";
import { EncodingSpecifier } from "../interface";

export { arrayEncoding, getUnsupportedEncoding, nullPlaceholder, objectEncoding };

export const builtinEncodings = [
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
] as EncodingSpecifier[];

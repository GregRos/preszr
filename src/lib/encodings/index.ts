import {
    arrayEncoding,
    nullPlaceholder,
    nullPrototypeEncoding,
    objectEncoding,
    unsupportedEncodings
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

export { arrayEncoding, nullPlaceholder, objectEncoding };

export const builtinEncodings: PrototypeEncoding<object>[] = [
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
    sharedArrayBufferEncoding,
    ...unsupportedEncodings
];

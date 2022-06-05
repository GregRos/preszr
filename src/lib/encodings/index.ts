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
import { EncodingStore } from "../encode/store";

export { arrayEncoding, nullPlaceholder, objectEncoding };

export function getDefaultStore() {
    const store = new EncodingStore();
    store.add(
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
    );
    return store;
}

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
import { knownSymbols } from "./known-symbols";

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
        ...unsupportedEncodings,
        ...knownSymbols
    );
    return store;
}

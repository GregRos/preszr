import { SpecialEncoding } from "../interface";
import { getBuiltInEncodingName, getSymbolName } from "../utils";
import { Fixed } from "./fixed-indexes";

// This isn't really an encoding. Encoding unrecognized symbols
// is handled by the library.
// In the future I'll implement it differently, but for now this is how it is.
export function getUnrecSymbolEncoding(s: symbol): SpecialEncoding {
    return new SpecialEncoding(
        getBuiltInEncodingName("unrecognizedSymbol"),
        getSymbolName(s),
        Fixed.UnrecognizedSymbol
    );
}

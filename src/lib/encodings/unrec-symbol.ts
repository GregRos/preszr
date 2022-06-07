import { SymbolEncoding } from "../interface";
import { getBuiltInEncodingName, getSymbolName } from "../utils";
import { FixedIndexes } from "./fixed-indexes";

// This isn't really an encoding. Encoding unrecognized symbols
// is handled by the library.
// In the future I'll implement it differently, but for now this is how it is.
export function getUnrecSymbolEncoding(s: symbol): SymbolEncoding {
    return new SymbolEncoding(
        getBuiltInEncodingName("UnknownSymbol"),
        s,
        FixedIndexes.UnknownSymbol,
        getSymbolName(s)
    );
}

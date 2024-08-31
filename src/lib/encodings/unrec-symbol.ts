import { SymbolEncoding } from "../interface"
import { getBuiltInEncodingName, getSymbolName } from "../utils"
import { FixedIndexes } from "./fixed-indexes"

export function getUnrecSymbolEncoding(s: symbol): SymbolEncoding {
    return new SymbolEncoding(
        getBuiltInEncodingName("UnknownSymbol"),
        s,
        FixedIndexes.UnknownSymbol,
        getSymbolName(s)
    )
}

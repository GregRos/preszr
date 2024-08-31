import { SymbolEncoding } from "../interface"

export function getKnownSymbolEncoding(s: symbol): SymbolEncoding[] {
    return s ? [new SymbolEncoding(`${s.description}`, s)] : []
}

export const knownSymbols = [
    ...getKnownSymbolEncoding(Symbol.asyncIterator),
    ...getKnownSymbolEncoding(Symbol.hasInstance),
    ...getKnownSymbolEncoding(Symbol.isConcatSpreadable),
    ...getKnownSymbolEncoding(Symbol.iterator),
    ...getKnownSymbolEncoding(Symbol.match),
    ...getKnownSymbolEncoding(Symbol.matchAll),
    ...getKnownSymbolEncoding(Symbol.replace),
    ...getKnownSymbolEncoding(Symbol.search),
    ...getKnownSymbolEncoding(Symbol.species),
    ...getKnownSymbolEncoding(Symbol.split),
    ...getKnownSymbolEncoding(Symbol.toPrimitive),
    ...getKnownSymbolEncoding(Symbol.toStringTag),
    ...getKnownSymbolEncoding(Symbol.unscopables)
] as SymbolEncoding[]

import { CreateContext, EncodeContext, PrototypeEncoding } from "../interface"
import { getBuiltInEncodingName } from "../utils"
import { FixedIndexes } from "./fixed-indexes"
import { defineProtoEncoding } from "./utils"

export const regexpEncoding = defineProtoEncoding(
    class RegexpEncoding extends PrototypeEncoding<RegExp> {
        encodes = RegExp.prototype
        version = 0
        name = getBuiltInEncodingName("RegExp")
        fixedIndex = FixedIndexes.RegExp

        encoder = {
            encode(z: RegExp, ctx: EncodeContext) {
                const { source, flags } = z
                return flags ? [source, flags] : source
            }
        }

        decoder = {
            create(input: string | string[], ctx: CreateContext) {
                if (typeof input === "string") {
                    return new RegExp(input)
                } else {
                    // A bit wasteful, but these shouldn't be common and this avoids having to do parsing.
                    return new RegExp(input[0], input[1])
                }
            }
        }
    }
)

export const dateEncoding = defineProtoEncoding(
    class DateEncoding extends PrototypeEncoding<Date> {
        encodes = Date.prototype
        version = 0
        fixedIndex = FixedIndexes.Date
        name = getBuiltInEncodingName("Date")

        encoder = {
            encode(input: Date, ctx: EncodeContext): any {
                return input.getTime()
            }
        }

        decoder = {
            create(encodedValue: number, ctx: CreateContext): any {
                return new Date(encodedValue)
            }
        }
    }
)

export function makeObjectWrappedEncoding<T extends object>(
    index: number,
    ctor: { new (x: any): T }
): PrototypeEncoding<T> {
    return defineProtoEncoding(
        class ObjectWrapperEncoding extends PrototypeEncoding<T> {
            name = getBuiltInEncodingName(ctor.name)
            version = 0
            fixedIndex = index
            encodes = ctor.prototype

            encoder = {
                encode(input: any, ctx: EncodeContext): any {
                    return input.valueOf()
                }
            }

            decoder = {
                create(encodedValue: any, ctx: CreateContext): any {
                    return new ctor(encodedValue)
                }
            }
        }
    )
}

export const wrapperEncodings = [
    makeObjectWrappedEncoding(FixedIndexes.FundNumber, Number),
    makeObjectWrappedEncoding(FixedIndexes.FundBool, Boolean),
    makeObjectWrappedEncoding(FixedIndexes.FundString, String)
]

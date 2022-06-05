import test from "ava";
import {
    CreateContext,
    EncodeContext,
    InitContext,
    Preszr,
    PrototypeSpecifier
} from "@lib";
import { encoded, preszr, testBuilder } from "../tools";
import { EncodedEntity } from "@lib/data";
import { Fixed } from "@lib/encodings/fixed-indexes";

test("invalid definition - has name", t => {
    t.throws(() =>
        Preszr([
            { encodes: Date.prototype, name: "should_be_empty", version: 100 }
        ])
    );
});

test("Invalid definition version is 0", t => {
    t.throws(() => {
        Preszr([{ encodes: Date.prototype, version: 0 }]);
    });
});
function getNewDateEncoding(version: number, magicKey: string) {
    return {
        encodes: Date.prototype,
        version,
        encode(input: any, ctx: EncodeContext): EncodedEntity {
            const arr = [input.getTime()];
            arr.push(input[magicKey]);

            return arr;
        },
        decoder: {
            create(encoded: EncodedEntity, ctx: CreateContext): unknown {
                return new Date(encoded[0]);
            },
            init(target: any, encoded: any[], ctx: InitContext) {
                target[magicKey] = ctx.decode(encoded[1]);
            }
        }
    };
}
test("Passes when valid", t => {
    t.notThrows(() => Preszr([getNewDateEncoding(1, "x")]));
});

test("modified Date is detected", t => {
    const time = Date.now();
    const a = new Date(time);
    const b = new Date(time);
    Object.assign(a, { a: 1 });
    t.notDeepEqual(a, b);
    Object.assign(b, { a: 1 });
    t.deepEqual(a, b);
});

const modifiedDateEncoding = getNewDateEncoding(1, "a");
const refDate = new Date();

{
    const testWithModifiedDates = testBuilder(
        Preszr([modifiedDateEncoding])
    ).get();
    const testObject = Object.assign(new Date(refDate), {
        a: 100
    });

    test("Override is used instead of default", testWithModifiedDates, {
        original: testObject,
        encoded: preszr(encoded([testObject.getTime(), 100], Fixed.Date))
    });
}

const modifiedDateEnc2 = getNewDateEncoding(2, "b");
{
    const testWith2Overrides = testBuilder(
        Preszr([modifiedDateEnc2, modifiedDateEncoding])
    ).get();

    test("2nd override used", testWith2Overrides, {
        original: Object.assign(new Date(refDate), { b: 100 }),
        encoded: preszr(encoded([refDate.getTime(), 100], Fixed.Date))
    });
}

import {encodeDecodeTest} from "./helpers";
import {SzrOutput} from "../lib/szr-representation";


function primitiveTests(decoded: any, encoded: SzrOutput, name?: string) {
    encodeDecodeTest(decoded, encoded, `primitive ${name ?? decoded}`);
}

primitiveTests()

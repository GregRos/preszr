import {Szr} from "./internal/szr";
import {SzrOutput} from "./internal/szr-representation";

const defaultSzr = new Szr();

/**
 * Encodes a value using szr with default settings.
 * @param x
 */
export const encode = x => defaultSzr.encode(x);

/**
 * Decodes an Szr
 * @param x
 */
export const decode = (x: SzrOutput) => defaultSzr.decode(x);

export {Szr};


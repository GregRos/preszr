import {Szr} from "./szr";

const defaultSzr = new Szr();

export const encode = x => defaultSzr.encode(x);

export const decode = x => defaultSzr.decode(x);

export {Szr};


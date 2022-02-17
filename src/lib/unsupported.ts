import {
    _AsyncFunction,
    _AsyncGenerator,
    _AsyncGeneratorFunction,
    _FinalizationRegistry,
    _Generator,
    _GeneratorFunction,
    _WeakRef
} from "./opt-types";

export const unsupportedTypes = [
    Function,
    _GeneratorFunction,
    _Generator,
    Promise,
    WeakSet,
    WeakMap,
    _AsyncGenerator,
    _AsyncGeneratorFunction,
    _FinalizationRegistry,
    _AsyncFunction,
    _WeakRef
]
    .map(x => x?.prototype)
    .filter(x => !!x);

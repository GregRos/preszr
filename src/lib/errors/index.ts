export class Preszr extends Error {
    name = "PreszrError"
    constructor(
        public readonly code: string,
        message: string
    ) {
        super(`${code} - ${message}`)
    }
}

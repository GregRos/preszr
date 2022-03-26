export class PreszrError extends Error {
    constructor(name: string, message: string) {
        super(`Preszr ${name} - ${message}`);
        this.name = name;
    }
}

export function errorNoTypeInEnv(type: string) {
    return new PreszrError(
        "Decoding",
        `Input encoded built-in type '${type}', but that type doesn't exist in this environment.`
    );
}

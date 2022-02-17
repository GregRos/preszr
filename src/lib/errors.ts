export class PreszrError extends Error {}

export function errorNoTypeInEnv(type: string) {
    return new PreszrError(
        `Input encoded built-in type '${type}', but that type doesn't exist in this environment.`
    );
}

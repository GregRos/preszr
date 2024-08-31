import { pathToFileURL } from "url"
Error.stackTraceLimit = 1000
Object.assign(global, require("lodash"))
const tsconfigPaths = require("tsconfig-paths")
const path = require("path")
tsconfigPaths.register({
    baseUrl: __dirname,
    paths: {
        "@lib/*": [path.join("..", "lib", "*")],
        "@lib": [path.join("..", "lib", "*")]
    }
})

function formatPathForOut(x: any) {
    if (typeof x === "string") {
        return x.replace(/\((src\/.*?)\)/g, (_, pth) => pathToFileURL(pth).toString())
    }
    return x
}
const origConsoleLog = console.log
console.log = function (...args) {
    args = args.map(formatPathForOut)
    return origConsoleLog.apply(console, args)
}
const origConsoleError = console.error
console.error = function (...args) {
    args = args.map(formatPathForOut)
    return origConsoleError.apply(console, args)
}

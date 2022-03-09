Object.assign(global, require("lodash"));
const tsconfigPaths = require("tsconfig-paths");
const path = require("path");

tsconfigPaths.register({
    baseUrl: __dirname,
    paths: {
        "@lib/*": [path.join("..", "lib", "*")],
        "@lib": [path.join("..", "lib", "*")]
    }
});

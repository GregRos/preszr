Object.assign(global, require("lodash"));
const { register } = require("ts-node");
register({
    project: `${__dirname}/tsconfig.json`
});

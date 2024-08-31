const { cat, echo } = require("shelljs");
const packageJson = cat(`${__dirname}/../package.json`);
let { version } = JSON.parse(packageJson);
version = version.split(".")[0]
echo(`export const version = "${version}";`).to("src/lib/version.ts");

const fs = require("fs");
const parser = require('./lang/parser');

const sourceFileName = process.argv[2];
const targetFileName = process.argv[3] || `${sourceFileName}.json`;

const file = fs.readFileSync(sourceFileName, "utf8");
const json = parser.parse(file);

fs.writeFileSync(targetFileName, JSON.stringify(json));
console.log(`${targetFileName} created`);


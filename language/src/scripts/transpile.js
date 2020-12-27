const fs = require('fs');
const { Parser } = require('../lang/parser');

const parser = Parser();

const sourceFileName = process.argv[2];
const targetFileName = process.argv[3] || `${sourceFileName}.json`;

const file = fs.readFileSync(sourceFileName, 'utf8');

try {
  const json = parser.parse(file);
  fs.writeFileSync(targetFileName, JSON.stringify(json));
  console.log(`${targetFileName} created`);
} catch (e) {
  console.error(`COMPILATION ERROR: ${e.message}`);
  process.exit(1);
}


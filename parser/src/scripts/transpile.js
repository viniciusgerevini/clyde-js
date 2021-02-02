import fs from 'fs';
import { Parser } from '../lang/parser.js';

const parser = Parser();

const createTargetFileName = (filename) => {
  if (filename.match(/\.clyde$/)) {
    return filename.replace(/\.clyde$/, '.json')
  }
  return `${filename}.json`
};

const sourceFileName = process.argv[2];
const targetFileName = process.argv[3] || createTargetFileName(sourceFileName);

const file = fs.readFileSync(sourceFileName, 'utf8');

try {
  const json = parser.parse(file);
  fs.writeFileSync(targetFileName, JSON.stringify(json));
  console.log(`${targetFileName} created`);
} catch (e) {
  console.error(`COMPILATION ERROR: ${e.message}`);
  process.exit(1);
}


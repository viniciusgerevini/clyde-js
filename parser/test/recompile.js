import fs from 'fs';
import { Parser } from '../src/lang/parser.js';

const parser = Parser();

const EXAMPLES_FOLDER = './test/samples/';
const RESULTS_FOLDER = './test/samples/results/';

const sourceFileName = process.argv[2];

const getSourceFiles = () => {
  return fs.readdirSync(EXAMPLES_FOLDER, { withFileTypes: true })
    .filter(f => f.isFile() && f.name.endsWith('.clyde'))
    .map( f => f.name );
}

const getFile = (path) => fs.readFileSync(path, "utf8");

const getSourceFile = (sourceFileName) => {
  return getFile(`${EXAMPLES_FOLDER}${sourceFileName}`);
};
const targetFileName = (sourceFileName) => {
  return `${RESULTS_FOLDER}${sourceFileName.replace(/\.clyde$/, '.json')}`;
};

const sources = sourceFileName ? [ sourceFileName ] : getSourceFiles();

sources.forEach(file => {
  const source = getSourceFile(file);
  const result = parser.parse(source);
  fs.writeFileSync(targetFileName(file), JSON.stringify(result));
  console.log(`File ${file} transpiled.`);
});


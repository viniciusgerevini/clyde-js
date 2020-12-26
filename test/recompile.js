const fs = require('fs');
const parser = require('../src/lang/parser');

const EXAMPLES_FOLDER = './examples/';
const RESULTS_FOLDER = './examples/results/';

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

getSourceFiles().forEach(file => {
  const source = getSourceFile(file);
  const result = parser.parse(source);
  fs.writeFileSync(targetFileName(file), JSON.stringify(result));
});


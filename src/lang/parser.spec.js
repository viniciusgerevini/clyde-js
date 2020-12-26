const fs = require('fs');
const parser = require('./parser');

describe('Check compilation results', () => {
  const EXAMPLES_FOLDER = './test/samples/';
  const RESULTS_FOLDER = './test/samples/results/';

  const getSourceFiles = () => {
    return fs.readdirSync(EXAMPLES_FOLDER, { withFileTypes: true })
      .filter(f => f.isFile() && f.name.endsWith('.clyde'))
      .map( f => f.name );
  }

  const getFile = (path) => fs.readFileSync(path, "utf8");

  const getSourceFile = (sourceFileName) => {
    return getFile(`${EXAMPLES_FOLDER}${sourceFileName}`);
  };

  const getExpectedResult = (sourceFileName) => {
    return getFile(`${RESULTS_FOLDER}${sourceFileName.replace(/\.clyde$/, '.json')}`);
  };

  test.each(getSourceFiles())('check: %s', (sourceFileName) => {
    const source = getSourceFile(sourceFileName);
    const expectedResult = getExpectedResult(sourceFileName);
    const result = parser.parse(source);

    expect(JSON.parse(JSON.stringify(result))).toEqual(JSON.parse(expectedResult));
  });
});

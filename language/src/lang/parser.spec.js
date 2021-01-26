import fs from 'fs';
import { Parser } from './parser';
import parse from '../parser';

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
    return getFile(resultFilePath(sourceFileName));
  };

  const resultFilePath = (sourceFileName) => `${RESULTS_FOLDER}${sourceFileName.replace(/\.clyde$/, '.json')}`;

  test.each(getSourceFiles())('check: %s', (sourceFileName) => {
    const source = getSourceFile(sourceFileName);
    const result = parse(source);

    if (process.env.SNAPSHOT_OVERWRITE) {
      if (sourceFileName === process.env.SNAPSHOT_OVERWRITE) {
        console.log(`Overwriting result file for ${process.env.SNAPSHOT_OVERWRITE}`);
        fs.writeFileSync(resultFilePath(process.env.SNAPSHOT_OVERWRITE), JSON.stringify(result));
      }
    }

    const expectedResult = getExpectedResult(sourceFileName);

    expect(JSON.parse(JSON.stringify(result))).toEqual(JSON.parse(expectedResult));
  });

  test('parser error message', () => {
    const parser = Parser();
    const source = "<<";

    try {
      const result = parser.parse(source);
      throw new Error("should have failed");
    } catch (e) {
      expect(e.message).toContain('Unexpected token on line 1');
    }
  });

  test('indentation error message: dedent', () => {
    const parser = Parser();
    const source = ">>\nhello";

    try {
      const result = parser.parse(source);
      throw new Error("should have failed");
    } catch (e) {
      expect(e.message).toContain('Unexpected indentation on line 2');
    }
  });

  test('indentation error message: indent', () => {
    const parser = Parser();
    const source = "hello\n  hey\n    ho";

    try {
      const result = parser.parse(source);
      throw new Error("should have failed");
    } catch (e) {
      expect(e.message).toContain('Unexpected indentation on line 2');
    }
  });

  test('notify invalid alternative mode', () => {
    const parser = Parser();
    const source = "[ random\n  hello\n]\n";

    try {
      const result = parser.parse(source);
      throw new Error("should have failed");
    } catch (e) {
      expect(e.message).toContain('Invalid alternative mode on line 1');
    }
  });
});

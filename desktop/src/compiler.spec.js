const fs = require('fs');
const yargs = require('yargs/yargs');

const { buildCompilerArgsParser, executeCompiler } = require('./compiler');

const SAMPLE_FILE = './test/sample.clyde';
const SAMPLE_OUTPUT = './test/sample_output.json';
const OUTPUT_FOLDER = './test/out';

const generateOutputFilename = (suffix) => {
  return `${OUTPUT_FOLDER}/${Date.now()}${suffix}.json`;
};

describe('CLI Compiler', () => {
  describe('argument parser', () => {
    it('throws error when no file provided', (done) => {
      const args = ['compile'];
      buildCompilerArgsParser(yargs()).parse(args, (err, _argv, _output) => {
        expect(err.message).toEqual('ERROR: Source file not provided.');
        done();
      })
    });

    it('sets input and output using positional arguments', (done) => {
      const args = ['compile', SAMPLE_FILE, 'output.json'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual(SAMPLE_FILE);
        expect(argv.output).toEqual('output.json');

        done();
      })
    });

    it('sets input and output using named arguments', (done) => {
      const args = ['compile', '-i', SAMPLE_FILE, '-o', 'output.json'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual(SAMPLE_FILE);
        expect(argv.output).toEqual('output.json');

        done();
      })
    });

    it('uses input for creating output name when output not provided', (done) => {
      const args = ['compile', '-i', SAMPLE_FILE];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual(SAMPLE_FILE);
        expect(argv.output).toEqual(SAMPLE_FILE.replace(/\.clyde$/, '.json'));

        done();
      })
    });

    it('always add json extension to generated output file name', (done) => {
      const fileWithNoExtension = SAMPLE_FILE.replace(/\.clyde$/, '')
      const args = ['compile', '-i',  fileWithNoExtension];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual(fileWithNoExtension);
        expect(argv.output).toEqual(`${fileWithNoExtension}.json`);

        done();
      })
    });

    it('fails if number of arguments in batch is different than arguments in batch-output', (done) => {
      const args = ['compile', '-b', 'a.clyde', 'b.clyde', '--batch-output', 'a.json'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          expect(err.message).toEqual('ERROR: input and output paths for batch operation should have same number of arguments.');
        } else {
          throw new Error('test should have failed');
        }

        done();
      })
    });

    it('fails if input file does not exist', (done) => {
      const DOES_NOT_EXIST = 'some_weird_file_that_does_not_exist.clyde';
      const args = ['compile', '-i',  DOES_NOT_EXIST];
      buildCompilerArgsParser(yargs()).parse(args, (err, _argv, _output) => {
        if (err) {
          expect(err.message).toEqual(`ERROR: file ${DOES_NOT_EXIST} does not exist.`);
        } else {
          throw new Error('test should have failed');
        }
        done();
      });
    });

    it('accepts folder as input', (done) => {
      const args = ['compile', '-i', './test'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.folderInput).toEqual('./test');
        expect(argv.folderOutput).toEqual('./test');

        done();
      });
    });

    it('uses folder output', (done) => {
      const args = ['compile', '-i', './test', '-o', './node_modules'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.folderInput).toEqual('./test');
        expect(argv.folderOutput).toEqual('./node_modules');

        done();
      });
    });

    it('uses positional folder output', (done) => {
      const args = ['compile', './test', './node_modules'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.folderInput).toEqual('./test');
        expect(argv.folderOutput).toEqual('./node_modules');

        done();
      });
    });

    it('fails if output folder does not exist', (done) => {
      const DOES_NOT_EXIST = './some-folder-a';
      const args = ['compile', './test',  DOES_NOT_EXIST];
      buildCompilerArgsParser(yargs()).parse(args, (err, _argv, _output) => {
        if (err) {
          expect(err.message).toEqual(`ERROR: output folder ${DOES_NOT_EXIST} does not exist.`);
        } else {
          throw new Error('test should have failed');
        }
        done();
      });
    });

    it('fails when input is a folder but output is not', (done) => {
      const args = ['compile', './test',  './test/sample'];
      buildCompilerArgsParser(yargs()).parse(args, (err, _argv, _output) => {
        if (err) {
          expect(err.message).toEqual('ERROR: output must be a folder when input is a folder.');
        } else {
          throw new Error('test should have failed');
        }
        done();
      });
    });
  });

  describe('execute', () => {
    it('calls exit callback when fails', (done) => {
      const args = { input: './test/random.clyde', output: generateOutputFilename('do_not_generate') };
      executeCompiler(args, (errorCode) => {
        expect(typeof errorCode).toBe('number');
        done();
      });
    });

    it('saves output file when success', (done) => {
      const args = { input: SAMPLE_FILE, output: generateOutputFilename('success') };
      executeCompiler(args, (errorCode) => {
        expect(errorCode).toBe(undefined);
        expect(fs.readFileSync(args.output, 'utf8')).toEqual(fs.readFileSync(SAMPLE_OUTPUT, 'utf8'));
        done();
      });
    });

    it('does not create output file when dry-run', (done) => {
      const args = ['compile', SAMPLE_FILE, generateOutputFilename('should_not_exist'), '-d'];
      const argv = buildCompilerArgsParser(yargs(args)).argv;
      executeCompiler(argv, (errorCode) => {
        expect(errorCode).toBe(undefined);
        expect(fs.existsSync(argv.output)).toBe(false);
        done();
      });
    });

    it('compiles multiple files in batch mode', (done) => {
      const sample1 = `${OUTPUT_FOLDER}/sample${Date.now()}1.clyde`;
      const sample2 = `${OUTPUT_FOLDER}/sample${Date.now()}2.clyde`;
      fs.copyFileSync(SAMPLE_FILE, sample1);
      fs.copyFileSync(SAMPLE_FILE, sample2);
      const args = ['compile', '-b', sample1, sample2];
      const argv = buildCompilerArgsParser(yargs(args)).argv;

      executeCompiler(argv, (errorCode) => {
        expect(errorCode).toBe(undefined);
        [sample1, sample2].forEach((sample) => {
          const output = sample.replace(/\.clyde$/, '.json');
          expect(fs.readFileSync(output, 'utf8')).toEqual(fs.readFileSync(SAMPLE_OUTPUT, 'utf8'));
        });
        done();
      });
    });

    it('compiles multiple files in batch mode defining output names', (done) => {
      const sample1 = `${OUTPUT_FOLDER}/sample${Date.now()}1.clyde`;
      const sample1Output = `${OUTPUT_FOLDER}/${Date.now()}s1.json`;
      const sample2Output = `${OUTPUT_FOLDER}/${Date.now()}s2.json`;

      fs.copyFileSync(SAMPLE_FILE, sample1);

      const args = ['compile', '-b', sample1, sample1, '--batch-output', sample1Output, sample2Output];
      const argv = buildCompilerArgsParser(yargs(args)).argv;
      executeCompiler(argv, (errorCode) => {
        expect(errorCode).toBe(undefined);
        [sample1Output, sample2Output].forEach((output) => {
          expect(fs.readFileSync(output, 'utf8')).toEqual(fs.readFileSync(SAMPLE_OUTPUT, 'utf8'));
        });
        done();
      });
    });

    it('compiles files from folder', (done) => {
      const sample1 = `${OUTPUT_FOLDER}/sample${Date.now()}1.clyde`;
      const sample2 = `${OUTPUT_FOLDER}/sample${Date.now()}2.clyde`;
      fs.copyFileSync(SAMPLE_FILE, sample1);
      fs.copyFileSync(SAMPLE_FILE, sample2);

      const args = ['compile', OUTPUT_FOLDER];
      const argv = buildCompilerArgsParser(yargs(args)).argv;

      executeCompiler(argv, (errorCode) => {
        expect(errorCode).toBe(undefined);
        [sample1, sample2].forEach((sample) => {
          const output = sample.replace(/\.clyde$/, '.json');
          expect(fs.readFileSync(output, 'utf8')).toEqual(fs.readFileSync(SAMPLE_OUTPUT, 'utf8'));
        });
        done();
      });
    });
  });
});

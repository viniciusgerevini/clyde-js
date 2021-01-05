const yargs = require('yargs/yargs');

const { buildCompilerArgsParser, executeCompiler } = require('./compiler');

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
      const args = ['compile', 'input.clyde', 'output.json'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual('input.clyde');
        expect(argv.output).toEqual('output.json');

        done();
      })
    });

    it('sets input and output using named arguments', (done) => {
      const args = ['compile', '-i', 'input.clyde', '-o', 'output.json'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual('input.clyde');
        expect(argv.output).toEqual('output.json');

        done();
      })
    });

    it('uses input for creating output name when output not provided', (done) => {
      const args = ['compile', '-i', 'input.clyde'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual('input.clyde');
        expect(argv.output).toEqual('input.json');

        done();
      })
    });

    it('always add json extension to generated output file name', (done) => {
      const args = ['compile', '-i', 'input'];
      buildCompilerArgsParser(yargs()).parse(args, (err, argv, _output) => {
        if (err) {
          throw new Error(err);
        }

        expect(argv.input).toEqual('input');
        expect(argv.output).toEqual('input.json');

        done();
      })
    });
  });

  describe('execute', () => {
    it('calls exit callback when finished', (done) => {
      const args = { input: 'file.clyde', output: 'file.json' };
      executeCompiler(args, () => {
        done();
      });
    });
  });
});

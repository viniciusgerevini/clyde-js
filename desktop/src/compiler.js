function buildCompilerArgsParser(yargs) {
  return yargs
    .usage(`Usage:\n$0 compile <source file path> <output file path>\n$0 compile -i <input> -o <output>`)
    .check((argv, _options) => {
      if (argv._.length === 1 && !argv.input) {
        throw new Error("ERROR: Source file not provided.");
      }

      if (!argv.input) {
        console.log('set')
        argv.input = argv._[1];
      }
      if (!argv.output) {
        if (argv._.length > 2) {
          argv.output = argv._[2];
        } else {
          argv.output = argv.input.replace(/\.clyde$/, '.json');
          if (argv.input === argv.output) {
            argv.output += '.json';
          }
        }
      }

      return true;
    })

    .option('input', {
      alias: 'i',
      type: 'string',
      description: 'Path to .clyde dialogue file'
    })

    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Path to output .json file. Default: <input>.json'
    })

    .option('batch', {
      alias: 'b',
      type: 'string',
      description: 'Compile multiple files at same time'
    })

    .option('dry-run', {
      alias: 'd',
      type: 'boolean',
      description: 'Do not generate output file. Only check for syntax errors.'
    })
    .help()
}

function executeCompiler(argv, exitCallback) {
  // TODO
  // compile
  // batch
  // dry-run
  console.log('COMPILER');
  console.log(argv);
  exitCallback();
};

module.exports = { buildCompilerArgsParser, executeCompiler };

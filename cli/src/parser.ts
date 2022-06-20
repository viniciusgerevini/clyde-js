import fs from 'fs';
import path from 'path';
import { parse } from '@clyde-lang/parser';
import yargs from 'yargs';

interface ParserCliArgs {
  input: string;
  output?: string;
  batch?: string[];
  batchOutput?: string[];
  dryRun: boolean;
  _: any;
  folderInput?: string;
  folderOutput?: string;
}

export function buildParserArgsParser(yargs: yargs.Argv) {
  return yargs
    .usage(`Usage:\n$0 parse <source file path> <output file path>\n$0 parse -i <input> -o <output>`)
    .check((a: any, _options) => {
      const argv = a as ParserCliArgs;
      if (argv.batch) {
        if (argv.batchOutput) {
          if (argv.batchOutput.length !== argv.batch.length) {
            throw new Error('ERROR: input and output paths for batch operation should have same number of arguments.')
          }
        } else {
          argv.batchOutput = argv.batch.map(i => outputFilename(i));
        }
        return true;
      }

      if (argv._.length === 1 && !argv.input) {
        throw new Error('ERROR: Source file not provided.');
      }


      if (!argv.input) {
        argv.input = argv._[1];
      }

      if (!fs.existsSync(argv.input)) {
        throw new Error(`ERROR: file ${argv.input} does not exist.`);
      }

      const stats = fs.statSync(argv.input);

      if (stats.isDirectory()) {
        argv.folderInput = argv.input;

        if (!argv.output) {
          if (argv._.length > 2) {
            argv.folderOutput = argv._[2];
          } else {
            argv.folderOutput = argv.input;
          }
        } else {
          argv.folderOutput = argv.output;
        }

        if (!fs.existsSync(argv.folderOutput)) {
          throw new Error(`ERROR: output folder ${argv.folderOutput} does not exist.`);
        }

        const outputStats = fs.statSync(argv.folderOutput);
        if (!outputStats.isDirectory()) {
          throw new Error('ERROR: output must be a folder when input is a folder.');
        }
        return true;
      }

      if (!argv.output) {
        if (argv._.length > 2) {
          argv.output = argv._[2];
        } else {
          argv.output = outputFilename(argv.input);
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
      type: 'array',
      description: 'Parse multiple files at same time'
    })

    .option('batch-output', {
      type: 'array',
      description: 'Path output names for batched files result. Should have same number of arguments as in --batch.'
    })

    .option('dry-run', {
      alias: 'd',
      type: 'boolean',
      description: 'Do not generate output file. Only check for syntax errors.'
    })
    .help()
}

export function executeParser(argv: ParserCliArgs, exitCallback: Function): void {
  try {
    if (argv.batch) {
      argv.batch.forEach((input, i) => {
        parseFile(input, argv.batchOutput[i], argv.dryRun);
      });
    } else if(argv.folderInput) {
      fs.readdirSync(argv.folderInput).forEach(file => {
        if ((file.match(/\.clyde$/) || []).length > 0) {
          const input = path.resolve(argv.folderInput, file);
          const output = path.resolve(argv.folderOutput, outputFilename(file));
          parseFile(input, output, argv.dryRun);
        }
      });
    } else {
      parseFile(argv.input, argv.output, argv.dryRun);
    }
    exitCallback();
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    exitCallback(1);
  }
};

const outputFilename = (input: string): string => {
  let output = input.replace(/\.clyde$/, '.json');
  if (input === output) {
    output += '.json';
  }
  return output;
}

const parseFile = (path: string, output: string, isDryRun: boolean): void => {
  const content = parse(fs.readFileSync(path, 'utf8'));
  if (!isDryRun) {
    fs.writeFileSync(output, JSON.stringify(content));
  }
};


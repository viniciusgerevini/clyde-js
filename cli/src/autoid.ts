import fs from 'fs';
import path from 'path';
import { addIds } from '@clyde-lang/parser';
import yargs from 'yargs';

interface IdGeneratorArgs {
  input: string;
  output?: string;
  batch?: string[];
  batchOutput?: string[];
  _: any;
  folderInput?: string;
  folderOutput?: string;
  replace?: boolean;
}

export function buildAutoIdArgsParser(yargs: yargs.Argv) {
  return yargs
    .usage(`Usage:
$0 autoid <input file> [output file]
$0 autoid -i <input> -o <output>`)
    .check((a: any, _options) => {
      const argv = a as IdGeneratorArgs;
      if (argv.batch) {
        if (argv.batchOutput) {
          if (argv.batchOutput.length !== argv.batch.length) {
            throw new Error('ERROR: input and output paths for batch operation should have same number of arguments.')
          }
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
          }
        } else {
          argv.folderOutput = argv.output;
        }

        if (argv.folderOutput && !fs.existsSync(argv.folderOutput)) {
          throw new Error(`ERROR: output folder ${argv.folderOutput} does not exist.`);
        }

        const outputStats = argv.folderOutput && fs.statSync(argv.folderOutput);
        if (outputStats && !outputStats.isDirectory()) {
          throw new Error('ERROR: output must be a folder when input is a folder.');
        }
        return true;
      }

      if (!argv.output) {
        if (argv._.length > 2) {
          argv.output = argv._[2];
        }
      }

      return true;
    })

    .option('input', {
      alias: 'i',
      type: 'string',
      description: 'Path to .clyde dialogue file or directory.'
    })

    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Path to output .clyde file or directory. If not provided, result is printed to stdout or original file is overwritten if --replace flag is provided.'
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

    .option('replace', {
      alias: 'r',
      type: 'boolean',
      description: 'Ovewrite input file instead of printing to stdout.'
    })
    .help().argv;
}

export function executeIdGenerator(argv: IdGeneratorArgs, exitCallback: Function): void {
  try {
    if (argv.batch) {
      argv.batch.forEach((input, i) => {
        generateIds(input, argv.batchOutput && argv.batchOutput[i], argv.replace);
      });
    } else if(argv.folderInput) {
      fs.readdirSync(argv.folderInput).forEach(file => {
        if ((file.match(/\.clyde$/) || []).length > 0) {
          const input = path.resolve(argv.folderInput, file);
          const output = argv.folderOutput ? path.resolve(argv.folderOutput, file) : undefined;
          generateIds(input, output, argv.replace);
        }
      });
    } else {
      generateIds(argv.input, argv.output, argv.replace);
    }
    exitCallback();
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    exitCallback(1);
  }
};

const generateIds = (path: string, output: string, replace: boolean): void => {
  const content = addIds(fs.readFileSync(path, 'utf8'));

  if (output) {
    console.log(`Auto-generating line ids for ${path}`);
    if (replace) {
      console.log("WARN: 'replace' option won't be used, because output path was provided.")
    }
    fs.writeFileSync(output, content);
  } else if (replace) {
    console.log(`Auto-generating line ids for ${path}`);
    fs.writeFileSync(path, content);
  } else {
    console.log(content);
  }
};


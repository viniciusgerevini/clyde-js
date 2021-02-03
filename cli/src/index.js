import yargs from 'yargs';
import { buildParserArgsParser, executeParser } from './parser.js';
import { buildInterpreterArgsParser, executeInterpreter } from './interpreter.js';


export function execute(args) {
   yargs(args)
    .command(
      'run',
      'Command line interpreter',
      (yargs) => buildInterpreterArgsParser(yargs, '$0 run'),
      (_argv) => executeInterpreter(args, process.exit)
    )
    .command(
      'parse',
      'Transforms *.clyde files to *.json',
      (yargs) => buildParserArgsParser(yargs),
      (argv) => executeParser(argv, process.exit)
    )
    .demandCommand()
    .help()
    .argv;
}

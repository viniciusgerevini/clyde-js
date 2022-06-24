import yargs from 'yargs';
import { buildParserArgsParser, executeParser } from './parser';
import { buildInterpreterArgsParser, executeInterpreter } from './interpreter';
import { buildAutoIdArgsParser, executeIdGenerator } from './autoid';


export function execute(args: string[]) {
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
      (argv) => executeParser(argv as any, process.exit)
    )
    .command(
      'autoid',
      'Auto-generate line ids',
      (yargs) => buildAutoIdArgsParser(yargs),
      (argv) => executeIdGenerator(argv as any, process.exit)
    )
    .demandCommand()
    .help()
    .argv;
}

import fs from 'fs';
import readline from 'readline';
import yargs from 'yargs';
import { parse } from '@clyde-lang/parser';
import {
  DialogueLine,
  DialogueOption,
  DialogueOptions,
  Dictionary,
  EventType,
  Interpreter,
  InterpreterInstance,
} from '@clyde-lang/interpreter';

export async function executeInterpreter(args: string[], exitCallback = process.exit, commandName?: string) {
  const argv = parseArguments(commandName, args);
  const filename = argv.file;
  const events = [];
  const dictionary = argv.translation ? await getTranslationDictionary(argv.translation) : undefined;
  const data = argv['save-data'] ? loadSaveFile(argv['save-data']) : undefined;

  const dialogue = Interpreter(getContent(filename), data, dictionary);
  const handlers = inputHandlers(dialogue, argv, events, exitCallback);

  dialogue.start(argv.block);

  dialogue.on(EventType.VARIABLE_CHANGED, trackInternalChanges('variable', events));
  dialogue.on(EventType.EVENT_TRIGGERED, trackInternalChanges('event', events));

  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  if (argv.clearScreen) {
    clearScreen();
  }
  printInputInstructions();


  rl.on('line', (i) => {
    const input = i.trim();
    if (Object.keys(handlers).includes(input)) {
      handlers[input]();
    } else {
      handlers['default'](input);
    }
  });

  rl.on('SIGINT', () => {
    handlers['exit']();
  });
}

const inputHandlers = (dialogue: InterpreterInstance, args: InterpreterCliArgs, events: any[], exitCallback: Function) => {
  const argv = args;
  let currentOptions: DialogueOption[] | undefined;

  const saveIfRequired = () => {
    if (argv['save-data']) {
      saveState(argv['save-data'], dialogue);
    }
  };

  const printContent = (content: DialogueLine | DialogueOptions | undefined) => {
    if (content === undefined) {
      console.log('-- END');
      if (argv.debug) {
        printDebugInfo(events);
      }
      saveIfRequired();
      exitCallback();
      return;
    }

    if (content.type === 'options') {
      printOptions(content, argv.verbose);
      currentOptions = content.options;
    } else {
      printLine(content, argv.verbose);
    }

    if (argv.debug) {
      printDebugInfo(events);
    }
  };

  const handleChoice = (options: DialogueOption[], input: any, dialogue: InterpreterInstance) => {
    if (isNaN(input) || Number(input) > options.length || Number(input) < 1) {
      console.log(`Your answer needs to be between 1 and ${options.length}.`)
      return false;
    }

    dialogue.choose(Math.floor(Number(input) - 1));
    currentOptions = undefined;
    return true;
  };

  return {
    exit() {
      saveIfRequired();
      exitCallback();
    },

    help() {
      printInputInstructions();
    },

    restart() {
      saveIfRequired();
      currentOptions = undefined;
      dialogue.start(argv.block);
      this.default();
    },

    default(input: any | undefined, untilOption = false) {
      if (argv.clearScreen) {
        clearScreen();
      }

      if (currentOptions && input !== undefined && !handleChoice(currentOptions, input, dialogue)) {
        return;
      }

      if (untilOption) {
        while (!currentOptions) {
          printContent(dialogue.getContent());
          console.log("");
        }
      } else {
        printContent(dialogue.getContent());
      }
    },

    next() {
      this.default(undefined, true);
    },

    auto(input: any) {
      this.default(input, true);

      if (currentOptions) {
        const choice = Math.floor(Math.random() * currentOptions.length) + 1;
        console.log(`Choose: ${choice}\n`)
        this.auto(choice);
      }
    }
  };
};

interface InterpreterCliArgs {
  block: string;
  file: string;
  translation: string;
  saveData: string;
  clearScreen: boolean;
  debug: boolean;
  verbose: boolean;
}

const parseArguments = (commandName: string, args: string[]): InterpreterCliArgs => {
  return buildInterpreterArgsParser(yargs(args), commandName).argv as any;
};

export const buildInterpreterArgsParser = (yargs: yargs.Argv, commandName = '$0') => {
  return yargs
    .usage(`Usage: ${commandName} [options] <file path>`)
    .check((argv, _options) => {
      if (argv._.length === 1 && !argv.file) {
        throw new Error("File not provided.");
      }

      if (!argv.file) {
        argv.file = argv._[1];
      }

      return true;
    })
    .option('block', {
      alias: 'b',
      type: 'string',
      description: 'Provide block name to run.'
    })

    .option('file', {
      alias: 'f',
      type: 'string',
      description: 'Path to .clyde or .json dialogue file'
    })

    .option('translation', {
      alias: 't',
      type: 'string',
      description: 'Path to .csv dictionary file'
    })

    .option('save-data', {
      alias: 's',
      type: 'string',
      description: 'Path to persist data to be used across executions'
    })

    .option('clear-screen', {
      alias: 'c',
      type: 'boolean',
      description: 'Clear screen on every line'
    })

    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Show information about internal state'
    })

    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    })

    .help()
    .version();
};

const printLine = (line: DialogueLine, verbose: boolean) => {
  const speaker = line.speaker ? `${line.speaker}: ` : '';
  const info = verbose ? extras(line) : '';
  console.log(breakText(`${speaker}${line.text}${info}`));
};

const printOptions = (content: DialogueOptions, verbose: boolean) => {
  const speaker = content.speaker ? `${content.speaker}: ` : '';
  const text = content.name ? `${content.name}` : '';
  const info = verbose ? extras(content) : '';
  console.log(breakText(`${speaker}${text}${info}\n`));
  content.options.forEach( (option: DialogueOption, index: number) => {
    console.log(breakText(`\t${index + 1} - ${option.label} ${verbose ? extras(option) : ''}`));
  });
  console.log('');
};

const extras = (content: DialogueLine | DialogueOption | DialogueOptions) => {
  const id = content.id ? ` | id: ${content.id}` : '';
  const tags = content.tags ? ` | tags: [${content.tags.join(', ')}]` : '';
  return `${id}${tags}`;
};

const printDebugInfo = (events: any[]) => {
  console.log('\n');
  separator();
  console.log('Debug:');
  console.table(events);
  separator();
};

function getContent(filename: string) {
  const extension = filename.split('.').pop();
  const file = fs.readFileSync(filename, 'utf8');

  if (extension === 'json') {
    return JSON.parse(file);
  }

  if (extension === 'clyde') {
    return parse(file);
  }
}

function getTranslationDictionary(file: string): Promise<Dictionary> {
  return new Promise((resolve, _reject) => {
    let dictionary = {};
    const lineReader = readline.createInterface({
      input: fs.createReadStream(file)
    });

    lineReader.on('line', function (line) {
      const parts = line.split(/[,|;]/);
      if (parts.length > 1) {
        dictionary[parts[0]] = parts[1];
      }
    });

    lineReader.on('close', () => {
      resolve(dictionary);
    });
  });
}

function loadSaveFile(saveFile: string) {
  if (fs.existsSync(saveFile)) {
    return JSON.parse(fs.readFileSync(saveFile) as any);
  }
}

function saveState(filename: string, dialogue: InterpreterInstance) {
  fs.writeFileSync(filename, JSON.stringify(dialogue.getData()));
}

function clearScreen(): void {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

function printInputInstructions(): void {
  console.log(`Press ENTER for next line.
Type "exit" to quit.
Type "restart" to restart dialogue without reseting variables.
Type "next" to execute until next branch.
Type "auto" to trigger Poltergeist mode (auto selection).
Type "help" to show this message again.`)
}

function separator(): void {
  console.log(Array(process.stdout.columns).join('-'));
}

function breakText(text: string): string {
  const columns = process.stdout.columns - 5;
  if (text.length > columns) {
    let replacement = text;
    const lines = Math.floor(replacement.length / columns);
    for (let i in Array(lines).fill(1)) {
      const breakIndex = replacement.lastIndexOf(' ', columns * (1+parseInt(i)));
      replacement = setCharAt(replacement, breakIndex, '\n');
    }
    return replacement;
  }
  return text;
}

function setCharAt(str: string, index: number, chr: string): string {
    if(index > str.length-1) {
      return str;
    }
    return str.substring(0,index) + chr + str.substring(index+1);
}

function trackInternalChanges(dataType: string, events: any): Function {
  return (data: any) => {
    let record = events.find((e: any) => e.name === data.name && e.type === dataType);
    if (!record) {
      record = data;
      events.push(record);
    }
    record.type = dataType;
    record.lastUpdate = Date.now();
    if (data.value) {
      record.value = data.value;
    }
  };
}

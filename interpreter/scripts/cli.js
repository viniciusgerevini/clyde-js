const fs = require('fs');
const readline = require('readline');
const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('../src/index');

function execute() {
  const filename = process.argv[2];
  // TODO
  // - notify file name not provided
  // - options to not clear screen
  // - option to not end dialog and allow retries
  // - help message

  const doc = getContent(filename);
  const dialogue = Interpreter(doc);

  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  clearScreen();

  console.log("Press Enter for next line. Type exit to quit.")

  let options;

  rl.on('line', (input) => {
    if (input === 'exit') {
      process.exit();
    }

    clearScreen();
    if (options && input) {
      if (isNaN(input) || Number(input) > options.length || Number(input) < 1) {
        console.log(`Your answer needs to be between 1 and ${options.length}.`)
        return;
      } else {
        dialogue.choose(Math.floor(Number(input) - 1));
        options = undefined;
      }
    }

    const content = dialogue.getContent();

    if (content === undefined) {
      console.log('-- END');
      process.exit();
    }

    if (content.type === 'options') {
      printOptions(content);
      options = content.options;
    } else {
      printLine(content);
    }
  });
}

const printLine = (line) => {
  const speaker = line.speaker ? `${line.speaker}: ` : '';
  console.log(`${speaker}${line.text}`);
};

const printOptions = (content) => {
  const speaker = content.speaker ? `${content.speaker}: ` : '';
  const text = content.name ? `${content.name}` : '';
  console.log(`${speaker}${text}\n`);
  content.options.forEach( (option, index) => {
    console.log(`\t${index + 1} - ${option.label}`);
  });
  console.log('');
};

function getContent(filename) {
  const parser = Parser();
  const extension = filename.split('.').pop();
  const file = fs.readFileSync(filename, 'utf8');

  if (extension === 'json') {
    return JSON.parse(file);
  }

  if (extension === 'clyde') {
    return parser.parse(file);
  }
}

function clearScreen() {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}


execute();

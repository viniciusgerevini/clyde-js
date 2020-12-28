const fs = require('fs');
const { Parser } = require('clyde-transpiler');

function execute() {
  const filename = process.argv[2];
  const doc = getContent(filename);

  console.log(doc);
}

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


execute();

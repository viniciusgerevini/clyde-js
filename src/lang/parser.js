const fs = require('fs');
const { Parser } = require('jison');

const { Lexer, getTokenHint } = require('./lexer');

function parser() {
  const grammar = fs.readFileSync('./src/lang/grammar.jison', 'utf8');
  const parser = new Parser(grammar);
  parser.lexer = Lexer();

  parser.yy.parseError = errorHandling;

  return parser;
}


function errorHandling(err, hash) {
  const expected = hash.expected.map(token => getTokenHint(cleanToken(token))).join(', ');
  const token = getTokenHint(cleanToken(hash.token));

  if (hash.expected.length == 1 && ["'INDENT'", "'DEDENT'"].includes(hash.expected[0])) {
    throw new Error(`Unexpected indentation on line ${hash.line}. Expected: ${expected}`);
  }

  if (['INDENT', 'DEDENT'].includes(token)) {
    throw new Error(`Unexpected indentation on line ${hash.line}.\n Expected: ${expected}`);
  }


  const message = `Unexpected token on line ${hash.line}: '${token}'.\n Expected: ${expected}`;

  throw new Error(message);
}

function cleanToken(token) {
  return token.replace(/\'/g, '');
}

module.exports = { Parser: parser };

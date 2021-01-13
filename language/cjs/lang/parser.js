'use strict';
// import fs from 'fs';
const jison = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('jison'));
const { Lexer, getTokenHint } = require('./lexer.js');
const grammar = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('./grammar'));

const { Parser: JisonParser } = jison;

function Parser() {
  // const grammar = fs.readFileSync(new URL('./grammar.jison', ({url: require('url').pathToFileURL(__filename).href}).url), 'utf8');
  const parser = new JisonParser(grammar());
  parser.lexer = Lexer();

  parser.yy.parseError = errorHandling;

  return parser;
}
exports.Parser = Parser


function errorHandling(_err, hash) {
  const expected = hash.expected.map(token => getTokenHint(cleanToken(token))).join(', ');
  const token = getTokenHint(cleanToken(hash.token));

  if (hash.expected.length == 1 && ["'INDENT'", "'DEDENT'"].includes(hash.expected[0])) {
    throw new Error(`Unexpected indentation on line ${hash.line}. Expected: ${expected}`);
  }

  if (token === 'INVALID_ALTERNATIVE_MODE') {
    throw new Error(`Invalid alternative mode on line ${hash.line}.\nAllowed values: <empty>, shuffle, once, cycle, sequence, shuffle once, shuffle cycle, shuffle sequence.`);
  }

  if (['INDENT', 'DEDENT'].includes(token)) {
    throw new Error(`Unexpected indentation on line ${hash.line}.\nExpected: ${expected}`);
  }


  const message = `Unexpected token on line ${hash.line}: '${token}'.\nExpected: ${expected}`;

  throw new Error(message);
}

function cleanToken(token) {
  return token.replace(/\'/g, '');
}


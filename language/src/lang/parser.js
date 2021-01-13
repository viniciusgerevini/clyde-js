// import fs from 'fs';
import jison from 'jison';
import { Lexer, getTokenHint } from './lexer.js';
import grammar from './grammar';

const { Parser: JisonParser } = jison;

export function Parser() {
  // const grammar = fs.readFileSync(new URL('./grammar.jison', import.meta.url), 'utf8');
  const parser = new JisonParser(grammar());
  parser.lexer = Lexer();

  parser.yy.parseError = errorHandling;

  return parser;
}


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


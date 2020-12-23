const fs = require("fs");
const { Parser } = require('jison');

const lexer = require('./lexer');
const grammar = fs.readFileSync("./src/lang/grammar.jison", "utf8");
const parser = new Parser(grammar);

parser.lexer = lexer;

module.exports = parser;

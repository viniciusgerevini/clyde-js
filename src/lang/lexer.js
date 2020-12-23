const Lexer = require('lex');

let indent = [0];
let col = 1;
let row = 1;

const lexer = new Lexer();

//comments
lexer.addRule(/^\s*\#+.*\n+/gm, (lexeme) => {
  row += 1;
});


lexer.addRule(/\n+/, function (lexeme) {
    row += lexeme.length;
    col = 1
    return "NEWLINE";
});

lexer.addRule(/^[\t ]*/gm, function (lexeme) {
  let indentation = lexeme.length;

  col += indentation

  if (indentation > indent[0]) {
      indent.unshift(indentation);
      return "INDENT";
  }

  var tokens = [];

  while (indentation < indent[0]) {
      tokens.push("DEDENT"); indent.shift(); }

  if (tokens.length) return tokens;
});

lexer.addRule(/\=\=\s*[A-z|0-9]+[^\r\n]+/m, function (lexeme) {
  this.yytext = lexeme.replace(/\={2}\s*/, '');
  setLoc(this, lexeme);
  return "BLOCK_START";
});

lexer.addRule(/^\>\>.*\n+/m, function (lexeme) {
  this.yytext = lexeme.replace(/^\>\>\s*/, '').replace(/\n/, '');
  if (this.yytext === "") {
    this.yytext = undefined;
  }
  setLoc(this, lexeme);
  row += 1;
  return "TOPIC_LIST_START";
});

lexer.addRule(/\<\<\s*\n+/m, function (lexeme) {
  this.yytext = lexeme;
  setLoc(this, lexeme);
  row += 1;
  return "TOPIC_LIST_END";
});

lexer.addRule(/\*\s*.+[^\r\n]+/m, function (lexeme) {
  this.yytext = lexeme.replace(/\*\s*/, '');
  setLoc(this, lexeme);
  return "TOPIC";
});

lexer.addRule(/\+\s*.+[^\r\n]+/m, function (lexeme) {
  this.yytext = lexeme.replace(/\+\s*/, '');
  setLoc(this, lexeme);
  return "STICKY_TOPIC";
});

lexer.addRule(/\-\>\s*[A-z|0-9]+\n+/m, function (lexeme) {
  this.yytext = lexeme.replace(/\-\>\s*/, '').replace('\n', '');
  setLoc(this, lexeme);
  return "DIVERT";
});

lexer.addRule(/\<\-\s*\n+/m, function (lexeme) {
  this.yytext = lexeme.replace(/\<\-\s*/, '').replace('\n', '');
  setLoc(this, lexeme);
  return "DIVERT_PARENT";
});

lexer.addRule(/\$id\:\s*[^\r\n|\s]*/, function (lexeme) {
  this.yytext = lexeme.replace(/\$id\:\s*/, '');
  setLoc(this, lexeme);
  return "LINE_ID";
});

lexer.addRule(/[A-z|0-9]+\:/gm, function (lexeme) {
  this.yytext = lexeme.replace(":", "");
  setLoc(this, lexeme);
  return "SPEAKER";
});

lexer.addRule(/[^\r\n\#\$]+/, function (lexeme) {
  this.yytext = lexeme;
  setLoc(this, lexeme);
  return "LINE";
});

lexer.addRule(/$/, function () {
    return "EOF";
});


function setLoc(lexer, lexeme) {
  lexer.yylloc.first_column = col;
  lexer.yylloc.last_column = col += lexeme.length;
  lexer.yylloc.first_line = row;
  lexer.yylloc.last_line = row;
}

module.exports = lexer;

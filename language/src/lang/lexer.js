const Lexer = require('lex');

const BASE_STATE = 0;
const LOGIC_STATE = 2;

const hints = {
  'AND': '&&, and',
  'OR': '||, or',
  'NOT':' not, !',
  'EQUAL':'==, is',
  'NOT_EQUAL': '!=, isnt',
  'GE': '>=',
  'LE': '<=',
  'PLUSEQUAL': '+=',
  'MINUSEQUAL': '-=',
  'NUMBER_LITERAL': 'number',
  'NULL_TOKEN': 'null',
  'BOOLEAN_LITERAL': 'boolean',
  'STRING_LITERAL': 'string',
  'VARIABLE': 'variable',
  'NEWLINE': 'line break',
  'BLOCK_START': '==',
  'TOPIC_LIST_START': '>>',
  'TOPIC_LIST_END': '<<',
  'TOPIC': '*',
  'STICKY_TOPIC': '+',
  'ALTERNATIVES_START': '[',
  'ALTERNATIVES_END': ']',
  'ANCHOR': '--',
  'DIVERT': '->',
  'DIVERT_PARENT': '<-',
  'LINE_ID': '$id: <line id>',
  'SPEAKER': '<speaker name>:',
  'LINE': 'text',
}

function getTokenHint(token) {
  return hints[token] || token;
}

function lexer() {
  let indent = [0];
  let col = 1;
  let row = 1;

  const lexer = new Lexer();

  //comments
  lexer.addRule(/^\s*\#+.*\n+/gm, (lexeme) => {
    row += countLineBreaks(lexeme);
  });

  lexer.addRule(/\{/, function (lexeme) {
    this.yytext = lexeme;
    this.state = LOGIC_STATE;
    setLoc(this, lexeme);
    return '{';
  });

  lexer.addRule(/\}/, function (lexeme) {
    this.yytext = lexeme;
    this.state = BASE_STATE;
    setLoc(this, lexeme);
    return '}';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\s+/gm, (lexeme) => {
  }, [ LOGIC_STATE ]);

  lexer.addRule(/set/, function (lexeme) {
    this.yytext = lexeme;
    setLoc(this, lexeme);
    return 'set';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/(\,)/i, function (lexeme) {
    this.yytext = lexeme;
    setLoc(this, lexeme);
    return ',';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/(\&\&|and)/i, function (lexeme) {
    this.yytext = 'and';
    setLoc(this, lexeme);
    return 'AND';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/(\|\||or)/i, function (lexeme) {
    this.yytext = 'or';
    setLoc(this, lexeme);
    return 'OR';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/(\!|not)/i, function (lexeme) {
    this.yytext = 'not';
    setLoc(this, lexeme);
    return 'NOT';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/(\=\=|is)/i, function (lexeme) {
    this.yytext = 'equal';
    setLoc(this, lexeme);
    return 'EQUAL';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/(\!\=|isnt)/i, function (lexeme) {
    this.yytext = 'not_equal';
    setLoc(this, lexeme);
    return 'NOT_EQUAL';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\>/, function (lexeme) {
    this.yytext = 'greater_than';
    setLoc(this, lexeme);
    return '>';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\</, function (lexeme) {
    this.yytext = 'less_than';
    setLoc(this, lexeme);
    return '<';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\>\=/, function (lexeme) {
    this.yytext = 'greater_or_equal_than';
    setLoc(this, lexeme);
    return 'GE';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\<\=/, function (lexeme) {
    this.yytext = 'less_or_equal_than';
    setLoc(this, lexeme);
    return 'LE';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\+/, function (lexeme) {
    this.yytext = 'add';
    setLoc(this, lexeme);
    return '+';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\-/, function (lexeme) {
    this.yytext = 'sub';
    setLoc(this, lexeme);
    return '-';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\//, function (lexeme) {
    this.yytext = 'div';
    setLoc(this, lexeme);
    return '/';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\*/, function (lexeme) {
    this.yytext = 'mult';
    setLoc(this, lexeme);
    return '*';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\%/, function (lexeme) {
    this.yytext = 'mod';
    setLoc(this, lexeme);
    return '%';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\^/, function (lexeme) {
    this.yytext = 'power';
    setLoc(this, lexeme);
    return '^';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\=/, function (lexeme) {
    this.yytext = 'assign';
    setLoc(this, lexeme);
    return '=';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\+\=/, function (lexeme) {
    this.yytext = 'add_assign';
    setLoc(this, lexeme);
    return 'PLUSEQUAL';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\-\=/, function (lexeme) {
    this.yytext = 'sub_assign';
    setLoc(this, lexeme);
    return 'MINUSEQUAL';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/[0-9]+/i, function (lexeme) {
    this.yytext = Number(lexeme);
    setLoc(this, lexeme);
    return 'NUMBER_LITERAL';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/null/i, function (lexeme) {
    this.yytext = lexeme;
    setLoc(this, lexeme);
    return 'NULL_TOKEN';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/(true|false)/i, function (lexeme) {
    this.yytext = lexeme.toLowerCase() === 'true';
    setLoc(this, lexeme);
    return 'BOOLEAN_LITERAL';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\".*\"/, function (lexeme) {
    this.yytext = lexeme.replace(/\"/g, '');
    setLoc(this, lexeme);
    return 'STRING_LITERAL';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/[A-z]+[A-z|0-9]*/, function (lexeme) {
    this.yytext = lexeme;
    setLoc(this, lexeme);
    return 'VARIABLE';
  }, [ LOGIC_STATE ]);

  lexer.addRule(/\n+/, function (lexeme) {
      row += lexeme.length;
      col = 1
      lexer.yylineno = row;
      return 'NEWLINE';
  });

  lexer.addRule(/^[\t ]*/gm, function (lexeme) {
    let indentation = lexeme.length;

    col += indentation

    if (indentation > indent[0]) {
        indent.unshift(indentation);
        return 'INDENT';
    }

    var tokens = [];

    while (indentation < indent[0]) {
        tokens.push('DEDENT'); indent.shift(); }

    if (tokens.length) return tokens;
  });

  lexer.addRule(/\s+/gm, (lexeme) => {
  });

  lexer.addRule(/\=\=\s*[A-z|0-9]+[^\r\n]+/m, function (lexeme) {
    this.yytext = lexeme.replace(/\={2}\s*/, '');
    setLoc(this, lexeme);
    return 'BLOCK_START';
  });

  lexer.addRule(/\>\>[^\n]*/m, function (lexeme) {
    this.yytext = lexeme.replace(/^\>\>\s*/, '').replace(/\n/, '');
    if (this.yytext === '') {
      this.yytext = undefined;
    }
    setLoc(this, lexeme);
    return 'TOPIC_LIST_START';
  });

  lexer.addRule(/\<\</m, function (lexeme) {
    this.yytext = lexeme;
    setLoc(this, lexeme);
    return 'TOPIC_LIST_END';
  });

  lexer.addRule(/\*\s*.*[^\r\n]+/m, function (lexeme) {
    this.yytext = lexeme.replace(/\*\s*/, '');
    setLoc(this, lexeme);
    return 'TOPIC';
  });

  lexer.addRule(/\+\s*.+[^\r\n]+/m, function (lexeme) {
    this.yytext = lexeme.replace(/\+\s*/, '');
    setLoc(this, lexeme);
    return 'STICKY_TOPIC';
  });

  lexer.addRule(/\[([^\r\n]+)?/, function (lexeme) {
    this.yytext = lexeme.replace(/^\[\s*/, '');
    setLoc(this, lexeme);

    if (this.yytext === '') {
      this.yytext = undefined;
    } else {
      const result = this.yytext.match(/(shuffle)?(\s*(once|cycle|sequence))?/);
      if (result.length === 0 || result[0] == '') {
        return 'INVALID_ALTERNATIVE_MODE';
      }
    }
    return 'ALTERNATIVES_START';
  });

  lexer.addRule(/\]/m, function (lexeme) {
    this.yytext = lexeme;
    setLoc(this, lexeme);
    return 'ALTERNATIVES_END';
  });

  lexer.addRule(/\-\s*\([A-z|0-9]+\)/m, function (lexeme) {
    this.yytext = lexeme.replace(/\-\s*\(([A-z|0-9]+)\)/, '$1');
    setLoc(this, lexeme);
    return 'ANCHOR';
  });

  lexer.addRule(/\-\>\s*[A-z|0-9]+/m, function (lexeme) {
    this.yytext = lexeme.replace(/\-\>\s*/, '');
    setLoc(this, lexeme);
    return 'DIVERT';
  });

  lexer.addRule(/\<\-/m, function (lexeme) {
    this.yytext = lexeme.replace(/\<\-\s*/, '');
    setLoc(this, lexeme);
    return 'DIVERT_PARENT';
  });

  lexer.addRule(/\$id\:\s*[^\r\n|\s]*/, function (lexeme) {
    this.yytext = lexeme.replace(/\$id\:\s*/, '');
    setLoc(this, lexeme);
    return 'LINE_ID';
  });

  lexer.addRule(/[A-z|0-9]+\:/gm, function (lexeme) {
    this.yytext = lexeme.replace(':', '');
    setLoc(this, lexeme);
    return 'SPEAKER';
  });

  lexer.addRule(/\".*\"/, function (lexeme) {
    this.yytext = lexeme.replace(/\"(.*)\"/,'$1');
    setLoc(this, lexeme);
    return 'LINE';
  });

  lexer.addRule(/[^\r\n|\#|\$|\{]+/, function (lexeme) {
    this.yytext = lexeme;
    setLoc(this, lexeme);
    return 'LINE';
  });

  lexer.addRule(/$/, function () {
      return 'EOF';
  });

  function setLoc(lexer, lexeme) {
    lexer.yylineno = row;
    lexer.yylloc.first_column = col;
    lexer.yylloc.last_column = col += lexeme.length;
    lexer.yylloc.first_line = row;
    lexer.yylloc.last_line = row += countLineBreaks(lexeme);
  }

  function countLineBreaks(lexeme) {
    return (lexeme.match(/\n/g) || []).length
  }

  lexer.getTokenHint = getTokenHint;

  return lexer;
}


module.exports = { Lexer: lexer, getTokenHint };

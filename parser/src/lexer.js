export const TOKENS = {
  TEXT: 'TEXT',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
  OPTION: 'OPTION',
  STICKY_OPTION: 'STICKY_OPTION',
  FALLBACK_OPTION: 'FALLBACK_OPTION',
  SQR_BRACKET_OPEN: 'SQR_BRACKET_OPEN',
  SQR_BRACKET_CLOSE: 'SQR_BRACKET_CLOSE',
  BRACKET_OPEN: 'BRACKET_OPEN',
  BRACKET_CLOSE: 'BRACKET_CLOSE',
  EOF: 'EOF',
  SPEAKER: 'SPEAKER',
  LINE_ID: 'LINE_ID',
  TAG: 'TAG',
  BLOCK: 'BLOCK',
  DIVERT: 'DIVERT',
  DIVERT_PARENT: 'DIVERT_PARENT',
  VARIATIONS_MODE: 'VARIATIONS_MODE',
  MINUS: '-',
  PLUS: '+',
  MULT: '*',
  DIV: '/',
  POWER: '^',
  MOD: '%',
  BRACE_OPEN: '{',
  BRACE_CLOSE: '}',
  AND: 'AND',
  OR: 'OR',
  NOT:'NOT',
  EQUAL: '==, is',
  NOT_EQUAL: '!=, isnt',
  GE: '>=',
  LE: '<=',
  GREATER: 'GREATER',
  LESS: 'LESS',
  NUMBER_LITERAL: 'number',
  NULL_TOKEN: 'null',
  BOOLEAN_LITERAL: 'boolean',
  STRING_LITERAL: 'string',
  IDENTIFIER: 'identifier',
  KEYWORD_SET: 'set',
  KEYWORD_TRIGGER: 'trigger',
  KEYWORD_WHEN: 'when',
  ASSIGN: '=',
  ASSIGN_SUM: '+=',
  ASSIGN_SUB: '-=',
  ASSIGN_DIV: '/=',
  ASSIGN_MULT: '*=',
  ASSIGN_POW: '^=',
  ASSIGN_MOD: '%=',
  COMMA: ',',
  LINE_BREAK: 'line break',
}

const MODES = {
  DEFAULT: 'DEFAULT',
  OPTION: 'OPTION',
  QSTRING: 'QSTRING',
  LOGIC: 'LOGIC',
  VARIATIONS: 'VARIATIONS',
};

const tokenFriendlyHint = {
  [TOKENS.TEXT]: 'text',
  [TOKENS.INDENT]: 'INDENT',
  [TOKENS.DEDENT]: 'DEDENT',
  [TOKENS.OPTION]: '*',
  [TOKENS.STICKY_OPTION]: '+',
  [TOKENS.FALLBACK_OPTION]: '>',
  [TOKENS.SQR_BRACKET_OPEN]: '[',
  [TOKENS.SQR_BRACKET_CLOSE]: ']',
  [TOKENS.BRACKET_OPEN]: '(',
  [TOKENS.BRACKET_CLOSE]: ')',
  [TOKENS.EOF]: 'EOF',
  [TOKENS.SPEAKER]: '<speaker name>:',
  [TOKENS.LINE_ID]: '$id',
  [TOKENS.TAG]: '#tag',
  [TOKENS.BLOCK]: '== <block name>',
  [TOKENS.DIVERT]: '-> <target name>',
  [TOKENS.DIVERT_PARENT]: '<-',
  [TOKENS.VARIATIONS_MODE]: '<variations mode>',
  [TOKENS.BRACE_OPEN]: '{',
  [TOKENS.BRACE_CLOSE]: '}',
  [TOKENS.AND]: '&&, and',
  [TOKENS.OR]: '||, or',
  [TOKENS.NOT]:' not, !',
  [TOKENS.EQUAL]: '==, is',
  [TOKENS.NOT_EQUAL]: '!=, isnt',
  [TOKENS.GE]: '>=',
  [TOKENS.LE]: '<=',
  [TOKENS.GREATER]: '>',
  [TOKENS.LESS]: '<',
}

export function getTokenFriendlyHint(token) {
  const hint = tokenFriendlyHint[token];
  if (!hint) {
    return token;
  }
  return hint;
}

export function tokenize(input) {
  let indent = [0];
  let position = 0;
  let line = 0;
  let column = 0;
  let length = input.length;
  let pendingTokens = [];
  const modes = [
    MODES.DEFAULT
  ];
  let currentQuote = null;

  const stackMode = (mode) => {
    modes.unshift(mode);
  };

  const popMode = () => {
    if (modes.length > 1) {
      modes.shift();
    }
  };

  const isCurrentMode = (mode) => {
    return modes[0] === mode;
  };

  const checkSequence = (string, initialPosition, value) => {
    const sequence = string.slice(initialPosition, initialPosition + value.length);
    return sequence === value;
  };


  // handle indentation
  const handleIndent = () => {
    let initialLine = line;

    let indentation = 0;
    while (input[position] && input[position].match(/[\t ]/)) {
      indentation += 1;
      position += 1;
    }
    if (indentation > indent[0]) {
        const previousIndent = indent[0];
        column += indentation;
        indent.unshift(indentation);
        return Token(TOKENS.INDENT, initialLine, previousIndent);
    }

    if (indentation === indent[0]) {
      column = indent[0]
      return;
    }

    let tokens = [];
    while (indentation < indent[0]) {
        indent.shift();
        column = indent[0];
        tokens.push(Token(TOKENS.DEDENT, line, column));
    }

    return tokens;
  };

  // handle comments
  const handleComments = () => {
    while (input[position] && input[position] !== '\n') {
      position += 1;
    }
    position += 1;
    line += 1;
  };

  // handle line breaks
  const handleLineBreaks = () => {
    while (input[position] === '\n') {
      line += 1;
      position += 1;
      column = 0;
    }

    if (isCurrentMode(MODES.OPTION)) {
      popMode();
    }
  };

  // handle spaces
  const handleSpace = () => {
    while (input[position] === ' ') {
      position += 1;
      column += 1;
    }
  };

  // handle text
  const handleText = () => {
    const initialLine = line;
    const initialColumn = column;
    let value = [];

    while (position < input.length) {
      const currentChar = input[position];

      if (['\n', '$', '#', '{' ].includes(currentChar) || (isCurrentMode(MODES.OPTION) && currentChar === ']')) {
        break;
      }

      if (currentChar === '\\' && input[position + 1] !== 'n') {
        value.push(input[position + 1]);
        position += 2;
        column += 2;
        continue;
      }

      if (currentChar === ':') {
        position += 1;
        column += 1;
        return Token(TOKENS.SPEAKER, initialLine, initialColumn, value.join('').trim());
      }

      value.push(currentChar);

      position += 1;
      column += 1;
    }


    return Token(TOKENS.TEXT, initialLine, initialColumn, value.join('').trim());
  };

  // handle text in quotes
  const handleQText = () => {
    const initialLine = line;
    const initialColumn = column;
    let value = [];

    while (position < input.length) {
      const currentChar = input[position];


      if (currentChar === currentQuote) {
        break;
      }

      if (currentChar === '\\' && input[position + 1] === currentQuote) {
        value.push(input[position + 1]);
        position += 2;
        column += 2;
        continue;
      }

      value.push(currentChar);

      position += 1;
      column += 1;
    }


    return Token(TOKENS.TEXT, initialLine, initialColumn, value.join('').trim());
  };

  // handle quote
  const handleQuote = () => {
    column += 1;
    position += 1;
    if (isCurrentMode(MODES.QSTRING)) {
      currentQuote = null;
      popMode();
    } else {
      stackMode(MODES.QSTRING);
    }
  };

  const optionTypes = {
    '*': TOKENS.OPTION,
    '+': TOKENS.STICKY_OPTION,
    '>': TOKENS.FALLBACK_OPTION,
  };

  // handle options
  const handleOption = () => {
    const token = optionTypes[input[position]];

    const initialColumn = column;
    column += 1;
    position += 1;
    stackMode(MODES.OPTION);
    return Token(token, line, initialColumn);
  };

  // handle brackets
  const handleBrackets = () => {
    const token = input[position] === '[' ? TOKENS.SQR_BRACKET_OPEN : TOKENS.SQR_BRACKET_CLOSE;
    const initialColumn = column;
    column += 1;
    position += 1;
    return Token(token, line, initialColumn);
  };

  const handleLineId = () => {
    const initialColumn = column;
    let values = [];
    position += 1;
    column += 1;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }
    return Token(TOKENS.LINE_ID, line, initialColumn, values.join(''));
  };

  const handleTag = () => {
    const initialColumn = column;
    let values = [];
    position += 1;
    column += 1;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }
    return Token(TOKENS.TAG, line, initialColumn, values.join(''));
  };

  const handleBlock = () => {
    const initialColumn = column;
    let values = [];
    position += 2;
    column += 2;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_| ]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }
    return Token(TOKENS.BLOCK, line, initialColumn, values.join('').trim());
  };

  const handleDivert = () => {
    const initialColumn = column;
    let values = [];
    position += 2;
    column += 2;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_| ]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }

    const token = Token(TOKENS.DIVERT, line, initialColumn, values.join('').trim());
    const linebreak = getFollowingLineBreak();
    if (linebreak) {
      return [ token, linebreak ];
    }

    return token;
  };

  const handleDivertToParent = () => {
    const initialColumn = column;
    position += 2;
    column += 2;

    const token = Token(TOKENS.DIVERT_PARENT, line, initialColumn);
    const linebreak = getFollowingLineBreak();

    if (linebreak) {
      return [ token, linebreak ];
    }

    return token;
  };

  const handleStartVariations = () => {
    const initialColumn = column;
    const values = [];
    column += 1;
    position += 1;
    stackMode(MODES.VARIATIONS);

    while (input[position] && input[position].match(/[A-Z|a-z| ]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }

    const tokens = [
      Token(TOKENS.BRACKET_OPEN, line, initialColumn)
    ];

    const value = values.join('').trim();

    if (value.length) {
      tokens.push(Token(TOKENS.VARIATIONS_MODE, line, initialColumn + 2, value));
    }

    return tokens;
  };

  const handleStopVariations = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    popMode();
    return Token(TOKENS.BRACKET_CLOSE, line, initialColumn);
  };

  const handleVariationItem = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    return Token(TOKENS.MINUS, line, initialColumn);
  };


  const handleLogicBlockStart = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    stackMode(MODES.LOGIC);
    const token = Token(TOKENS.BRACE_OPEN, line, initialColumn);
    const linebreak = getLeadingLineBreak();
    if (linebreak) {
      return [ linebreak, token ];
    }
    return token;
  };

  const handleLogicBlockStop = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    popMode();
    const token = Token(TOKENS.BRACE_CLOSE, line, initialColumn);
    const linebreak = getFollowingLineBreak();
    if (linebreak) {
      return [ token, linebreak ];
    }
    return token;
  };

  const keywords = [
    'is', 'isnt', 'or', 'and', 'not', 'true', 'false', 'null',
    'set', 'trigger', 'when'
  ];

  const handleLogicIdentifier = () => {
    const initialColumn = column;
    let values = '';

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_]/)) {
      values += input[position];
      position += 1;
      column += 1;
    }

    if (keywords.includes(values.toLowerCase())) {
      return handleLogicDescriptiveOperator(values, initialColumn);
    }

    return Token(TOKENS.IDENTIFIER, line, initialColumn, values.trim());
  };

  const handleLogicDescriptiveOperator = (value, initialColumn) => {
    switch(value.toLowerCase()) {
      case 'not':
        return Token(TOKENS.NOT, line, initialColumn);
      case 'and':
        return Token(TOKENS.AND, line, initialColumn);
      case 'or':
        return Token(TOKENS.OR, line, initialColumn);
      case 'is':
        return Token(TOKENS.EQUAL, line, initialColumn);
      case 'isnt':
        return Token(TOKENS.NOT_EQUAL, line, initialColumn);
      case 'true':
      case 'false':
        return Token(TOKENS.BOOLEAN_LITERAL, line, initialColumn, value);
      case 'null':
        return Token(TOKENS.NULL_TOKEN, line, initialColumn);
      case 'set':
        return Token(TOKENS.KEYWORD_SET, line, initialColumn);
      case 'trigger':
        return Token(TOKENS.KEYWORD_TRIGGER, line, initialColumn);
      case 'when':
        return Token(TOKENS.KEYWORD_WHEN, line, initialColumn);
    }

  };

  const handleLogicNot = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    return Token(TOKENS.NOT, line, initialColumn);
  };

  const handleLogicOperator = (token, length) => {
    const initialColumn = column;
    column += length;
    position += length;
    return Token(token, line, initialColumn);
  };

  const handleLogicNumber = () => {
    const initialColumn = column;
    let values = '';

    while (input[position] && input[position].match(/[0-9|.]/)) {
      values += input[position];
      position += 1;
      column += 1;
    }

    return Token(TOKENS.NUMBER_LITERAL, line, initialColumn, values);
  };

  const handleLogicString = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    const token = handleQText();
    column += 1;
    position += 1;

    token.token = TOKENS.STRING_LITERAL;
    token.column = initialColumn;

    return token;
  };

  const createSimpleToken = (token, length = 1) => {
    const initialColumn = column;
    column += length;
    position += length;
    return Token(token, line, initialColumn);
  };

  const handleLogicBlock = () => {
    if (input[position] === '"' || input[position] == "'") {
      if (currentQuote === null) {
        currentQuote = input[position]
      }
      return handleLogicString();
    }

    if (input[position] === '}') {
      return handleLogicBlockStop();
    }

    if (checkSequence(input, position, '==')) {
      return handleLogicOperator(TOKENS.EQUAL, 2);
    }

    if (checkSequence(input, position, '!=')) {
      return handleLogicOperator(TOKENS.NOT_EQUAL, 2);
    }

    if (checkSequence(input, position, '&&')) {
      return handleLogicOperator(TOKENS.AND, 2);
    }

    if (checkSequence(input, position, '||')) {
      return handleLogicOperator(TOKENS.OR, 2);
    }

    if (checkSequence(input, position, '<=')) {
      return handleLogicOperator(TOKENS.LE, 2);
    }

    if (checkSequence(input, position, '>=')) {
      return handleLogicOperator(TOKENS.GE, 2);
    }

    if (checkSequence(input, position, '<')) {
      return handleLogicOperator(TOKENS.LESS, 1);
    }

    if (checkSequence(input, position, '>')) {
      return handleLogicOperator(TOKENS.GREATER, 1);
    }

    if (input[position] === '=') {
      return createSimpleToken(TOKENS.ASSIGN);
    }

    if (checkSequence(input, position, '-=')) {
      return createSimpleToken(TOKENS.ASSIGN_SUB, 2);
    }

    if (checkSequence(input, position, '+=')) {
      return createSimpleToken(TOKENS.ASSIGN_SUM, 2);
    }

    if (checkSequence(input, position, '*=')) {
      return createSimpleToken(TOKENS.ASSIGN_MULT, 2);
    }

    if (checkSequence(input, position, '/=')) {
      return createSimpleToken(TOKENS.ASSIGN_DIV, 2);
    }

    if (checkSequence(input, position, '^=')) {
      return createSimpleToken(TOKENS.ASSIGN_POW, 2);
    }

    if (checkSequence(input, position, '%=')) {
      return createSimpleToken(TOKENS.ASSIGN_MOD, 2);
    }

    if (input[position] === '+') {
      return createSimpleToken(TOKENS.PLUS, 1);
    }

    if (input[position] === '-') {
      return createSimpleToken(TOKENS.MINUS, 1);
    }

    if (input[position] === '*') {
      return createSimpleToken(TOKENS.MULT, 1);
    }

    if (input[position] === '/') {
      return createSimpleToken(TOKENS.DIV, 1);
    }

    if (input[position] === '^') {
      return createSimpleToken(TOKENS.POWER, 1);
    }

    if (input[position] === '%') {
      return createSimpleToken(TOKENS.MOD, 1);
    }

    if (input[position] === ',') {
      return createSimpleToken(TOKENS.COMMA, 1);
    }

    if (input[position] === '!') {
      return handleLogicNot();
    }

    if (input[position].match(/[0-9]/)) {
      return handleLogicNumber();
    }

    if (input[position].match(/[A-Za-z]/)) {
      return handleLogicIdentifier();
    }
  };

  const getFollowingLineBreak = () => {
    let lookupPosition = position;
    let lookupColumn = column;
    while (input[lookupPosition] === ' ') {
      lookupPosition += 1;
      lookupColumn += 1;
    }

    if (input[lookupPosition] === '\n') {
      return Token(TOKENS.LINE_BREAK, line, lookupColumn);
    }
  };

  const getLeadingLineBreak = () => {
    let lookupPosition = position - 2;
    while (input[lookupPosition] === ' ') {
      lookupPosition -= 1;
    }

    if (input[lookupPosition] === '\n') {
      return Token(TOKENS.LINE_BREAK, line, 0);
    }
  };

  // get next token
  function getNextToken() {
    if (!isCurrentMode(MODES.QSTRING) && input[position] === '-' && input[position + 1] === '-') {
      return handleComments();
    }

    if (!isCurrentMode(MODES.QSTRING) && input[position] === '\n') {
      return handleLineBreaks();
    }

    if (!isCurrentMode(MODES.LOGIC) && ((column === 0 && input[position].match(/[\t ]/)) || (column === 0 && indent.length > 1))) {
      return handleIndent();
    }

    if (!isCurrentMode(MODES.QSTRING) && input[position] === '{') {
      return handleLogicBlockStart();
    }

    if(isCurrentMode(MODES.LOGIC)) {
      const response = handleLogicBlock();

      if (response)  {
        return response;
      }
    }

    if (input[position] === '"' || input[position] === "'") {
      if (currentQuote === null) {
        currentQuote = input[position]
      }

      if (input[position] === currentQuote) {
        return handleQuote();
      }
    }

    if (isCurrentMode(MODES.QSTRING)) {
      return handleQText();
    }

    if (input[position] === ' ') {
      return handleSpace();
    }

    if (input[position] === '(') {
      return handleStartVariations();
    }

    if (input[position] === ')') {
      return handleStopVariations();
    }

    if (column === 0 && input[position] === '=' && input[position + 1] === '=') {
      return handleBlock();
    }

    if (input[position] === '-' && input[position + 1] === '>') {
      return handleDivert();
    }

    if (input[position] === '<' && input[position + 1] === '-') {
      return handleDivertToParent();
    }

    if (isCurrentMode(MODES.VARIATIONS) && input[position] === '-') {
      return handleVariationItem();
    }

    if (input[position] === '*' || input[position] === '+'|| input[position] === '>') {
      return handleOption();
    }

    if (isCurrentMode(MODES.OPTION) && ['[', ']' ].includes(input[position])) {
      return handleBrackets();
    }

    if (input[position] === '$') {
      return handleLineId();
    }

    if (input[position] === '#') {
      return handleTag();
    }

    return handleText();
  }

  return {
    // returns a list with all tokens
    getAll() {
      let tokens = [];
      while (position < length) {
        const token = getNextToken(input, position, line, column, indent);
        if (token) {
          if (Array.isArray(token)) {
            tokens = tokens.concat(token);
          } else {
            tokens.push(token);
          }
        }
      }

      position += 1;
      tokens.push(Token(TOKENS.EOF, line, column));

      return tokens;
    },

    // retuns a token each time
    next() {
      if (pendingTokens.length) {
        return pendingTokens.shift();
      }

      while (position < length) {
        const token = getNextToken(input, position, line, column, indent);
        if (token) {
          if (Array.isArray(token)) {
            pendingTokens = token;
            return pendingTokens.shift();
          } else {
            return token;
          }
        }
      }

      if (position === length) {
        position += 1;
        return Token(TOKENS.EOF, line, column);
      }
    }
  }
}

export function Token(token, line, column, value) {
  return {
    token,
    value,
    line,
    column
  };
}



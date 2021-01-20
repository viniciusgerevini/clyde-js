export const TOKENS = {
  TEXT: 'TEXT',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
  OPTION: 'OPTION',
  STICKY_OPTION: 'STICKY_OPTION',
  SQR_BRACKET_OPEN: 'SQR_BRACKET_OPEN',
  SQR_BRACKET_CLOSE: 'SQR_BRACKET_CLOSE',
  QUOTE: '"',
  EOF: 'EOF',
  SPEAKER: 'SPEAKER',
  LINE_ID: 'LINE_ID',
  TAG: 'TAG',
  BLOCK: 'BLOCK',
}

const MODES = {
  DEFAULT: 'DEFAULT',
  OPTION: 'OPTION',
  QSTRING: 'QSTRING',
  LOGIC: 'LOGIC'
};

const tokenFriendlyHint = {
  [TOKENS.TEXT]: 'text',
  [TOKENS.INDENT]: 'INDENT',
  [TOKENS.DEDENT]: 'DEDENT',
  [TOKENS.OPTION]: '*',
  [TOKENS.STICKY_OPTION]: '+',
  [TOKENS.SQR_BRACKET_OPEN]: '[',
  [TOKENS.SQR_BRACKET_CLOSE]: ']',
  [TOKENS.QUOTE]: '"',
  [TOKENS.EOF]: 'EOF',
  [TOKENS.SPEAKER]: '<speaker name>:',
  [TOKENS.LINE_ID]: '$id',
  [TOKENS.TAG]: '#tag',
  [TOKENS.BLOCK]: '== <block name>',
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
  let mode = MODES.DEFAULT;

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

    if (mode === MODES.OPTION) {
      mode = MODES.DEFAULT;
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

      if (['\n', '$', '#' ].includes(currentChar) || (mode === MODES.OPTION && currentChar === ']')) {
        break;
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


      if (currentChar === '"') {
        break;
      }

      if (currentChar === '\\' && input[position + 1] === '"') {
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
    const initialColumn = column;
    column += 1;
    position += 1;
    if (mode === MODES.QSTRING) {
      mode = MODES.DEFAULT;
    } else {
      mode = MODES.QSTRING;
    }
    return Token(TOKENS.QUOTE, line, initialColumn);
  };

  // handle options
  const handleOption = () => {
    const token = input[position] === '*' ? TOKENS.OPTION : TOKENS.STICKY_OPTION;
    const initialColumn = column;
    column += 1;
    position += 1;
    mode = MODES.OPTION;
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

    while (input[position].match(/[A-Z|a-z|0-9|_]/)) {
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

  // get next token
  function getNextToken() {
    if (mode === MODES.DEFAULT && input[position] === '-' && input[position + 1] === '-') {
      return handleComments();
    }

    if ((column === 0 && input[position].match(/[\t ]/)) || (column === 0 && indent.length > 1)) {
      return handleIndent();
    }

    if (mode !== MODES.QSTRING && input[position] === '\n') {
      return handleLineBreaks();
    }

    if (input[position] === '"') {
      return handleQuote();
    }

    if (mode === MODES.QSTRING) {
      return handleQText();
    }


    if (input[position] === ' ') {
      return handleSpace();
    }

    if (column === 0 && input[position] === '=' && input[position] === '=') {
      return handleBlock();
    }

    if (input[position] === '*' || input[position] === '+') {
      return handleOption();
    }

    if (mode === MODES.OPTION && ['[', ']' ].includes(input[position])) {
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

      if (position === length) {
        position += 1;
        return Token(TOKENS.EOF, line, column);
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



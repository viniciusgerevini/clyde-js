export const TOKENS = {
  TEXT: 'TEXT',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
  OPTION: 'OPTION',
  STICKY_OPTION: 'STICKY_OPTION',
  SQR_BRACKET_OPEN: 'SQR_BRACKET_OPEN',
  SQR_BRACKET_CLOSE: 'SQR_BRACKET_CLOSE',
  EOF: 'EOF',
  SPEAKER: 'SPEAKER',
  LINE_ID: 'LINE_ID',
  TAG: 'TAG',
}

const MODES = {
  DEFAULT: 'DEFAULT',
  OPTION: 'OPTION',
  QSTRING: 'QSTRING',
  LOGIC: 'LOGIC'
};

export function tokenize(input) {
  let indent = [0];
  let position = 0;
  let line = 0;
  let row = 0;
  let length = input.length;
  let pendingTokens = [];
  let mode = MODES.DEFAULT;

  // handle indentation
  const handleIndent = () => {
    let initialLine = line;

    let indentation = 0;
    while (input[position].match(/[\t ]/)) {
      indentation += 1;
      position += 1;
    }
    if (indentation > indent[0]) {
        const previousIndent = indent[0];
        row += indentation;
        indent.unshift(indentation);
        return Token(TOKENS.INDENT, initialLine, previousIndent);
    }

    if (indentation === indent[0]) {
      row = indent[0]
      return;
    }

    let tokens = [];
    while (indentation < indent[0]) {
        indent.shift();
        row = indent[0];
        tokens.push(Token(TOKENS.DEDENT, line, row));
    }

    return tokens;
  };

  // handle comments
  const handleComments = () => {
    while (input[position] !== undefined && input[position] !== '\n') {
      position += 1;
    }
    position += 1;
  };

  // handle line breaks
  const handleLineBreaks = () => {
    while (input[position] === '\n') {
      line += 1;
      position += 1;
      row = 0;
    }

    if (mode === MODES.OPTION) {
      mode = MODES.DEFAULT;
    }
  };

  // handle spaces
  const handleSpace = () => {
    while (input[position] === ' ') {
      position += 1;
      row += 1;
    }
  };

  // handle text
  const handleText = () => {
    const initialLine = line;
    const initialRow = row;
    let value = [];

    while (position < input.length) {
      const currentChar = input[position];

      if (['\n', '$', '#' ].includes(currentChar) || (mode === MODES.OPTION && currentChar === ']')) {
        break;
      }

      if (currentChar === ':') {
        position += 1;
        row += 1;
        return Token(TOKENS.SPEAKER, initialLine, initialRow, value.join('').trim());
      }

      value.push(currentChar);

      position += 1;
      row += 1;
    }

    return Token(TOKENS.TEXT, initialLine, initialRow, value.join('').trim());
  };

  // handle options
  const handleOption = () => {
    const token = input[position] === '*' ? TOKENS.OPTION : TOKENS.STICKY_OPTION;
    const initialRow = row;
    row += 1;
    position += 1;
    mode = MODES.OPTION;
    return Token(token, line, initialRow);
  };

  // handle brackets
  const handleBrackets = () => {
    const token = input[position] === '[' ? TOKENS.SQR_BRACKET_OPEN : TOKENS.SQR_BRACKET_CLOSE;
    const initialRow = row;
    row += 1;
    position += 1;
    return Token(token, line, initialRow);
  };

  const handleLineId = () => {
    const initialRow = row;
    let values = [];
    position += 1;
    row += 1;

    while (input[position].match(/[A-z|0-9]/)) {
      values.push(input[position]);
      position += 1;
      row += 1;
    }
    return Token(TOKENS.LINE_ID, line, initialRow, values.join(''));
  };

  const handleTag = () => {
    const initialRow = row;
    let values = [];
    position += 1;
    row += 1;

    while (input[position].match(/[A-z|0-9]/)) {
      values.push(input[position]);
      position += 1;
      row += 1;
    }
    return Token(TOKENS.TAG, line, initialRow, values.join(''));
  };

  // get next token
  function getNextToken() {
    if ((row === 0 && input[position].match(/[\t ]/)) || (row === 0 && indent.length > 1)) {
      return handleIndent();
    }

    if (input[position] === '-' && input[position + 1] === '-') {
      return handleComments();
    }

    if (input[position] === '\n') {
      return handleLineBreaks();
    }

    if (input[position] === ' ') {
      return handleSpace();
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
        const token = getNextToken(input, position, line, row, indent);
        if (token) {
          if (Array.isArray(token)) {
            tokens = tokens.concat(token);
          } else {
            tokens.push(token);
          }
        }
      }

      position += 1;
      tokens.push(Token(TOKENS.EOF, line, row));

      return tokens;
    },

    // retuns a token each time
    next() {
      if (pendingTokens.length) {
        return pendingTokens.shift();
      }

      if (position === length) {
        position += 1;
        return Token(TOKENS.EOF, line, row);
      }

      while (position < length) {
        const token = getNextToken(input, position, line, row, indent);
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

export function Token(token, line, row, value) {
  return {
    token,
    value,
    line,
    row
  };
}



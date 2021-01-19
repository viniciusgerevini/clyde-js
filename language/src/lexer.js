export const TOKENS = {
  TEXT: 'TEXT',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
  OPTION_LIST_START: 'OPTION_LIST_START',
  OPTION_LIST_END: 'OPTION_LIST_END',
  OPTION: 'OPTION',
  STICKY_OPTION: 'STICKY_OPTION',
  EOF: 'EOF',
}


export function tokenize(input) {
  let indent = [0];
  let position = 0;
  let line = 0;
  let row = 0;
  let length = input.length;
  let pendingTokens = [];

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
  };

  // handle text
  const handleText = () => {
    const initialLine = line;
    const initialRow = row;
    let value = [];
    let leadingSpaces = 0;

    while (position < input.length) {
      const currentChar = input[position];

      if (currentChar === '\n') {
        break;
      }

      if (!value.length && currentChar === ' ') {
        leadingSpaces += 1;
      } else {
        value.push(currentChar);
      }

      position += 1;
      row += 1;
    }

    return Token(TOKENS.TEXT, initialLine, initialRow + leadingSpaces, value.join('').trim());
  };

  // handle options list start
  const handleOptionsListStart = () => {
    const initialRow = row;
    row += 2;
    position += 2;
    return Token(TOKENS.OPTION_LIST_START, line, initialRow);
  };

  // handle options list start
  const handleOptionsListEnd = () => {
    const initialRow = row;
    row += 2;
    position += 2;
    return Token(TOKENS.OPTION_LIST_END, line, initialRow);
  };

  // handle options
  const handleOption = () => {
    const token = input[position] === '*' ? TOKENS.OPTION : TOKENS.STICKY_OPTION;
    const initialRow = row;
    row += 1;
    position += 1;
    return Token(token, line, initialRow);
  };

  // get next token
  function getNextToken() {
    if ((row === 0 && input[position].match(/[\t ]/)) || (row === 0 && indent.length > 1)) {
      return handleIndent();
    }

    if (input[position] === '#') {
      return handleComments();
    }

    if (input[position] === '\n') {
      return handleLineBreaks();
    }

    if (input[position] === '>' && input[position + 1] === '>') {
      return handleOptionsListStart();
    }

    if (input[position] === '<' && input[position + 1] === '<') {
      return handleOptionsListEnd();
    }

    if (input[position] === '*' || input[position] === '+') {
      return handleOption();
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



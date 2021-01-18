export const TOKENS = {
  TEXT: 'TEXT',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
}


export function tokenize(input) {
  let indent = [0];
  let position = 0;
  let line = 0;
  let row = 0;
  let length = input.length;
  let tokens = [];

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
        return Token(TOKENS.INDENT, undefined, initialLine, previousIndent);
    }

    if (indentation === indent[0]) {
      row = indent[0]
      return;
    }

    let tokens = [];
    while (indentation < indent[0]) {
        indent.shift();
        row = indent[0];
        tokens.push(Token(TOKENS.DEDENT, undefined, line, row));
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
    let initialLine = line;
    let initialRow = row;
    let value = [];

    while (position < input.length) {
      const currentChar = input[position];

      if (currentChar === '\n') {
        break;
      }

      value.push(currentChar);

      position += 1;
      row += 1;
    }

    return Token(TOKENS.TEXT, value.join(''), initialLine, initialRow);
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

    return handleText();
  }


  // tokenize
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
  return tokens;
}



// export default function Lexer() {
//   let input;
//
//   function tokenize() {
//     let indent = [0];
//     let position = 0;
//     let line = 0;
//     let row = 0;
//     let length = input.length;
//     let tokens = [];
//
//     while (position < length) {
//       const result = getNextToken(input, position, line, row, indent);
//       position = result.position;
//       line = result.line;
//       row = result.row;
//       if (result.token) {
//         if (result.multiple) {
//           result.token.forEach(token => tokens.push(token));
//         } else {
//           tokens.push(result.token);
//         }
//       }
//     }
//     return tokens;
//   }
//
//   function getNextToken(input, initialPosition, initialLine, initialRow, indent) {
//     let position = initialPosition;
//     let line = initialLine;
//     let row = initialRow;
//     let value = [];
//
//     // handle indent
//     if ((row === 0 && input[position].match(/[\t ]/)) || (row === 0 && indent.length > 1)) {
//       let indentation = 0;
//       while (input[position].match(/[\t ]/)) {
//         indentation += 1;
//         position += 1;
//       }
//       if (indentation > indent[0]) {
//           const previousIndent = indent[0];
//           row += indentation;
//           indent.unshift(indentation);
//           return {
//             position,
//             line,
//             row,
//             token: Token(TOKENS.INDENT, undefined, initialLine, previousIndent)
//           };
//       }
//
//       if (indentation === indent[0]) {
//         row = indent[0]
//         return {
//           position,
//           line,
//           row,
//         };
//       }
//
//       let tokens = [];
//       while (indentation < indent[0]) {
//           indent.shift();
//           row = indent[0];
//           tokens.push(Token(TOKENS.DEDENT, undefined, line, row));
//       }
//
//       return {
//         position,
//         line,
//         row,
//         token: tokens,
//         multiple: true,
//       };
//     }
//
//
//     // handle comments
//     if (input[position] === '#') {
//       while (input[position] !== undefined && input[position] !== '\n') {
//         position += 1;
//       }
//       position += 1;
//       return { line, row, position };
//     }
//
//     // handle line breaks
//     if (input[position] === '\n') {
//       while (input[position] === '\n') {
//         line += 1;
//         position += 1;
//         row = 0;
//       }
//       return { line, row, position };
//     }
//
//     // handle line
//     while (position < input.length) {
//       const currentChar = input[position];
//
//       if (currentChar === '\n') {
//         break;
//       }
//
//       value.push(currentChar);
//
//       position += 1;
//       row += 1;
//     }
//     return {
//       position,
//       line,
//       row,
//       token: Token(TOKENS.TEXT, value.join(''), initialLine, initialRow)
//     };
//   }
//
//   return {
//     setInput(doc) {
//       input = doc;
//     },
//     tokenize
//   }
// }
//

export function Token(token, value, line, row) {
  return {
    token,
    value,
    line,
    row
  };
}



import { TOKENS, Token, tokenize } from './lexer';

export interface AddIdsOptions {
  idGenerator?: Function;
}

export function addIds(clydeDocument: string, options: AddIdsOptions = {}) {
  const idGenerator = options.idGenerator || generateSimpleId;
  const tokens = tokenize(clydeDocument).getAll();
  const lines = clydeDocument.split("\n");

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let idPosition: IdPosition;
    if ([TOKENS.OPTION, TOKENS.STICKY_OPTION, TOKENS.FALLBACK_OPTION].includes(token.token)) {
      let offset = i + 1;
      for (;offset < tokens.length; offset++) {
        if (tokens[offset].token === TOKENS.TEXT) {
          break;
        }
      }
      idPosition = findPositionForId(tokens, offset, false)
    } else if (token.token === TOKENS.TEXT) {
      idPosition = findPositionForId(tokens, i);
    }

    if (idPosition) {
      if (!idPosition.idFound) {
        let line = lines[idPosition.line];

        if (idPosition.startColumn > 0 && ['"', "'"].includes(line[idPosition.startColumn - 1])) {
          if (line[idPosition.column]) {
            idPosition.column += 1;
          } else { // this means the quotted text has line breaks
            idPosition.column = idPosition.column - line.length;
            idPosition.line += 1;
            line = lines[idPosition.line];
          }
        }

        lines[idPosition.line] = addAt(line, ` $${idGenerator()}`, idPosition.column);
      }
      i = idPosition.index;
    }
  }
  return lines.join("\n");
}

interface IdPosition {
  line: number;
  column: number;
  startColumn: number;
  idFound: boolean;
  index: number;
}

function findPositionForId(tokens: Token[], startingPosition: number, allowIndent: boolean = true): IdPosition {
  let placeToken = tokens[startingPosition];
  let index = startingPosition;
  let allowText = false;
  let idFound = false;

  for (let i = startingPosition + 1; i < tokens.length; i++) {
    const token = tokens[i];

    if (allowIndent && token.token === TOKENS.INDENT) {
      allowText = true;
      index = i;
      continue;
    }

    if (token.token === TOKENS.LINE_ID) {
      index = i;
      idFound = true;
    } else if (token.token === TOKENS.TEXT && allowText) {
      index = i;
      placeToken = token;
    } else if (token.token !== TOKENS.TAG) {
      break;
    }
  }

  return {
    line: placeToken.line,
    column: placeToken.column + placeToken.value.length,
    startColumn: placeToken.column,
    index,
    idFound,
  };
}

function addAt(text: string, extraContent: string, position: number) {
  return text.substring(0, position) + extraContent + text.substring(position);
}

function generateSimpleId() {
  return idPiece() + idPiece() + idPiece()
}

function idPiece() {
  return ((Math.random() * 46656) | 0).toString(36).padStart(3, "0");
}

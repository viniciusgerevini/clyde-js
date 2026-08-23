import type {
  PrepareRenameParams,
  Range,
  RenameParams,
  TextEdit,
  WorkspaceEdit,
} from "vscode-languageserver";
import { getLogger } from "../utils/logger.js";
import type { WorkingDocument } from "../document/working_document.js";
import { Lexer } from "@clyde-lang/parser";

const logger = getLogger();

const RENAMEABLE_TOKENS = [
  Lexer.TOKENS.TAG,
  Lexer.TOKENS.BLOCK,
  Lexer.TOKENS.DIVERT,
  Lexer.TOKENS.SPEAKER,
];

const TAG_ALLOWED_NAME = /^[\w_\-.]+$/;
const BLOCK_ALLOWED_NAME = /^[\w_\- ]+$/;
const SPEAKER_ALLOWED_NAME = /^[\w_\-. ]+$/;

const newValuePatterns = {
  [Lexer.TOKENS.TAG]: TAG_ALLOWED_NAME,
  [Lexer.TOKENS.BLOCK]: BLOCK_ALLOWED_NAME,
  [Lexer.TOKENS.DIVERT]: BLOCK_ALLOWED_NAME,
  [Lexer.TOKENS.SPEAKER]: SPEAKER_ALLOWED_NAME,
};

export function onRenameRequest(
  params: RenameParams,
  workingDocument: WorkingDocument,
): WorkspaceEdit | undefined {
  logger.info("RENAME ", { params, workingDocument });

  for (let token of workingDocument.getTokens()) {
    if (!RENAMEABLE_TOKENS.includes(token.token)) {
      if (token.line > params.position.line) {
        break;
      }
      continue;
    }

    if (token.line === params.position.line) {
      if (isInTokenRange(token, params.position.character)) {
        return buildRenameResponse(params, workingDocument, token);
      } else if (token.column > params.position.character) {
        return;
      }
    }
  }
  return;
}

function buildRenameResponse(
  params: RenameParams,
  workingDocument: WorkingDocument,
  tokenToRename: Lexer.Token,
): WorkspaceEdit | undefined {
  if (
    newValuePatterns[tokenToRename.token] &&
    !newValuePatterns[tokenToRename.token]!.test(params.newName)
  ) {
    logger.error("Rename value not allowed");
    return;
  }
  let tokensToSearch: string[];

  if (tokenToRename.token === Lexer.TOKENS.DIVERT || tokenToRename.token === Lexer.TOKENS.BLOCK) {
    tokensToSearch = [Lexer.TOKENS.DIVERT, Lexer.TOKENS.BLOCK];
  } else if (tokenToRename.token === Lexer.TOKENS.SPEAKER) {
    tokensToSearch = [tokenToRename.token];
  } else {
    tokensToSearch = [tokenToRename.token];
  }

  const changes: TextEdit[] = [];

  for (let token of workingDocument.getTokens()) {
    if (!tokensToSearch.includes(token.token)) {
      continue;
    }

    if (token.value === tokenToRename.value) {
      changes.push({
        range: getTokenRange(token),
        newText: params.newName,
      });
    }
  }

  return {
    changes: {
      [workingDocument.getDocumentUri()]: changes,
    },
  };
}

export function onPrepareRenameRequest(
  params: PrepareRenameParams,
  workingDocument: WorkingDocument,
): Range | undefined {
  for (let token of workingDocument.getTokens()) {
    if (!RENAMEABLE_TOKENS.includes(token.token)) {
      logger.info("NOPE TOKE ", token);
      if (token.line > params.position.line) {
        break;
      }
      continue;
    }

    if (token.line === params.position.line) {
      if (isInTokenRange(token, params.position.character)) {
        // this indicates an external divert that is not supported at the moment
        if (token.token === Lexer.TOKENS.DIVERT && token.value?.startsWith("{")) {
          return;
        }
        return getTokenRange(token);
      } else if (token.column > params.position.character) {
        return;
      }
    }
  }
  return;
}

function isInTokenRange(token: Lexer.Token, character: number): boolean {
  const length = token.length!; // all supported tokens have length
  return character >= token.column && character < token.column + length;
}

function getTokenRange(token: Lexer.Token): Range {
  // for speakers, special characters are at the end
  if (token.token === Lexer.TOKENS.SPEAKER) {
    return {
      start: {
        line: token.line,
        character: token.column,
      },
      end: {
        line: token.line,
        character: token.column + token.length! - 1,
      },
    };
  }

  // blocks and tags have special characters at begining
  return {
    start: {
      line: token.line,
      character: token.column + token.length! - token.value!.length,
    },
    end: {
      line: token.line,
      character: token.column + token.length!,
    },
  };
}

import { Lexer } from "@clyde-lang/parser";
import {
  SemanticTokenTypes,
  SemanticTokenModifiers,
  type SemanticTokensLegend,
  SemanticTokensBuilder,
  SemanticTokens,
} from "vscode-languageserver/node";
import { getLogger } from "../logger.js";
import type { WorkingDocument } from "./working_document.js";

const tokenTypes: SemanticTokenTypes[] = [
  SemanticTokenTypes.comment,
  SemanticTokenTypes.variable,
  SemanticTokenTypes.keyword,
  SemanticTokenTypes.enumMember,
  SemanticTokenTypes.operator,
  SemanticTokenTypes.parameter,
  SemanticTokenTypes.typeParameter,
  SemanticTokenTypes.number,
  SemanticTokenTypes.string,
  SemanticTokenTypes.type,
  SemanticTokenTypes.function,
  SemanticTokenTypes.struct,
];

const tokenModifiers: SemanticTokenModifiers[] = [SemanticTokenModifiers.definition];

export const semanticTokensLegend: SemanticTokensLegend = {
  tokenTypes,
  tokenModifiers,
};

const tokenMapping: Record<string, number> = {
  [Lexer.TOKENS.OPTION]: tokenIndex(SemanticTokenTypes.function),
  [Lexer.TOKENS.STICKY_OPTION]: tokenIndex(SemanticTokenTypes.function),
  [Lexer.TOKENS.FALLBACK_OPTION]: tokenIndex(SemanticTokenTypes.function),
  [Lexer.TOKENS.SPEAKER]: tokenIndex(SemanticTokenTypes.string),
  [Lexer.TOKENS.LINE_ID]: tokenIndex(SemanticTokenTypes.parameter),
  [Lexer.TOKENS.TAG]: tokenIndex(SemanticTokenTypes.type),
  [Lexer.TOKENS.ID_SUFFIX]: tokenIndex(SemanticTokenTypes.typeParameter),

  [Lexer.TOKENS.BLOCK]: tokenIndex(SemanticTokenTypes.struct),
  [Lexer.TOKENS.DIVERT]: tokenIndex(SemanticTokenTypes.function),
  [Lexer.TOKENS.DIVERT_PARENT]: tokenIndex(SemanticTokenTypes.function),
  [Lexer.TOKENS.VARIATIONS_MODE]: tokenIndex(SemanticTokenTypes.enumMember),
  [Lexer.TOKENS.MINUS]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.PLUS]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.MULT]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.DIV]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.POWER]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.MOD]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.AND]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.OR]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.NOT]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.EQUAL]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.NOT_EQUAL]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.GE]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.LE]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.GREATER]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.LESS]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.NUMBER_LITERAL]: tokenIndex(SemanticTokenTypes.number),
  [Lexer.TOKENS.NULL_TOKEN]: tokenIndex(SemanticTokenTypes.keyword),
  [Lexer.TOKENS.BOOLEAN_LITERAL]: tokenIndex(SemanticTokenTypes.keyword),
  [Lexer.TOKENS.STRING_LITERAL]: tokenIndex(SemanticTokenTypes.string),
  [Lexer.TOKENS.IDENTIFIER]: tokenIndex(SemanticTokenTypes.variable),
  [Lexer.TOKENS.KEYWORD_SET]: tokenIndex(SemanticTokenTypes.keyword),
  [Lexer.TOKENS.KEYWORD_TRIGGER]: tokenIndex(SemanticTokenTypes.keyword),
  [Lexer.TOKENS.KEYWORD_WHEN]: tokenIndex(SemanticTokenTypes.keyword),
  [Lexer.TOKENS.KEYWORD_MATCH]: tokenIndex(SemanticTokenTypes.keyword),
  [Lexer.TOKENS.KEYWORD_DEFAULT]: tokenIndex(SemanticTokenTypes.keyword),
  [Lexer.TOKENS.ASSIGN]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.ASSIGN_SUM]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.ASSIGN_SUB]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.ASSIGN_DIV]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.ASSIGN_MULT]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.ASSIGN_POW]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.ASSIGN_MOD]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.ASSIGN_INIT]: tokenIndex(SemanticTokenTypes.operator),
  [Lexer.TOKENS.COMMA]: tokenIndex(SemanticTokenTypes.operator),
  // [Lexer.TOKENS.LINK_FILE]: tokenIndex(SemanticTokenTypes.type),
};

function tokenIndex(semanticToken: SemanticTokenTypes): number {
  return tokenTypes.indexOf(semanticToken);
}

const logger = getLogger();

export function buildSemanticResponseForDocument(document: WorkingDocument): SemanticTokens {
  const tokens = document.getTokens();
  const content = document.getContent();

  const builder = new SemanticTokensBuilder();

  for (let token of tokens) {
    const semanticData = getTokenSemanticData(token);

    if (semanticData) {
      logger.debug("CONVERT CLYDE TOKEN", token);
      builder.push(
        semanticData.line,
        semanticData.column,
        semanticData.length,
        semanticData.semanticIndex,
        -1,
      );
    }
  }

  handleFullLines(content, builder);

  return builder.build();
}

function getTokenSemanticData(
  token: Lexer.Token,
): { line: number; column: number; length: number; semanticIndex: number } | undefined {
  const tokenIndex = tokenMapping[token.token];

  if (!tokenIndex) {
    return;
  }

  const line = token.line;
  const column = token.column;
  const length = token.length || token.value?.length || 0;

  return { line, column, length, semanticIndex: tokenIndex };
}

function handleFullLines(content: string, builder: SemanticTokensBuilder): void {
  const lines = content.split("\n");

  logger.info(builder.id);

  for (let line in lines) {
    if (lines[line]?.startsWith("--")) {
      builder.push(Number(line), 0, lines[line].length, tokenIndex(SemanticTokenTypes.comment), -1);
    } else if (lines[line]?.startsWith("@link")) {
      handleFileLink(Number(line), lines[line], builder);
    }
  }
}

const LINK_REGEX = /(@link)(\s+)([^\s|=]+)(\s*)(=?)(\s*)([^\s]*)(\s*)\n?/i;
// link regex groups
enum LinkParts {
  FULL_MATCH = 0,
  LINK_TAG = 1,
  PRE_IDENTIFIER_SPACES = 2,
  IDENTIFIER = 3,
  POST_IDENTIFIER_SPACES = 4,
  ASSIGNMENT = 5,
  POST_ASSIGNMENT_SPACES = 6,
  PATH = 7,
  EVERYTHING_ELSE = 8,
}

function handleFileLink(lineNumber: number, line: string, builder: SemanticTokensBuilder): void {
  let column: number = 0;
  builder.push(lineNumber, column, 5, tokenIndex(SemanticTokenTypes.keyword), -1);
  column += 5;

  const matches = line.match(LINK_REGEX);

  if (!matches) {
    return;
  }

  logger.debug("LINK MATCHES", { matches });

  const preIdSpaces = matches[LinkParts.PRE_IDENTIFIER_SPACES] || "";
  const identifier = matches[LinkParts.IDENTIFIER] || "";
  const postIdSpaces = matches[LinkParts.POST_IDENTIFIER_SPACES] || "";
  const assignment = matches[LinkParts.ASSIGNMENT] || "";
  const postAssignmentSpaces = matches[LinkParts.POST_ASSIGNMENT_SPACES] || "";
  const path = matches[LinkParts.PATH] || "";

  column += preIdSpaces.length;

  if (identifier.length) {
    builder.push(
      lineNumber,
      column,
      identifier.length,
      tokenIndex(SemanticTokenTypes.variable),
      -1,
    );
    column += identifier.length;
  }

  column += postIdSpaces.length;

  if (assignment.length) {
    builder.push(
      lineNumber,
      column,
      assignment.length,
      tokenIndex(SemanticTokenTypes.operator),
      -1,
    );
    column += assignment.length;
  }

  column += postAssignmentSpaces.length;

  if (path.length) {
    builder.push(lineNumber, column, path.length, tokenIndex(SemanticTokenTypes.string), -1);
  }
}

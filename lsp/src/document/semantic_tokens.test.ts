import { describe, it, expect, vi, beforeEach } from "vitest";
import { SemanticTokenTypes } from "vscode-languageserver/node";
import { WorkingDocument } from "./working_document";
import { buildSemanticResponseForDocument, tokenIndex } from "./semantic_tokens";
import { Lexer } from "@clyde-lang/parser";

describe("Semantic Tokens", () => {
  const sampleContent = ` 
this wont cover all scenarios, but it's a good test case $some_id
another line #banana { true }
  `;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns correct semantic tokens for document", () => {
    const doc = new WorkingDocument("fake_uri");
    doc.updateContent(sampleContent);

    const response = buildSemanticResponseForDocument(doc);

    // delta line, delta column, length, semantic token index, modifier
    // the actual text is ignored because it does not have significance for highlighting
    expect(response.data).toEqual([
      1,
      57,
      8,
      tokenIndex(SemanticTokenTypes.parameter),
      -1, // line id
      1,
      13,
      7,
      tokenIndex(SemanticTokenTypes.type),
      -1, // tag
      0,
      10,
      4,
      tokenIndex(SemanticTokenTypes.keyword),
      -1, // boolean
    ]);
  });

  it("handles comments", () => {
    const doc = new WorkingDocument("fake_uri");
    doc.updateContent("-- this is a comment line");

    const response = buildSemanticResponseForDocument(doc);

    expect(response.data).toEqual([0, 0, 25, tokenIndex(SemanticTokenTypes.comment), -1]);
  });

  it("handles different external link formats", () => {
    const doc = new WorkingDocument("fake_uri");

    const contentWithLinks = `
@link to_import
@link common = ./to_import
@link common2=to_import
@link     common3       =   ../test/dialogue_samples/to_import.clyde
@link
`;

    doc.updateContent(contentWithLinks);

    const response = buildSemanticResponseForDocument(doc);

    // delta line, delta column, length, semantic token index, modifier
    // the actual text is ignored because it does not have significance for highlighting
    expect(response.data).toEqual([
      // first line
      1,
      0,
      5,
      tokenIndex(SemanticTokenTypes.keyword),
      -1, // @link
      0,
      6,
      9,
      tokenIndex(SemanticTokenTypes.variable),
      -1, // to_import
      // second line
      1,
      0,
      5,
      tokenIndex(SemanticTokenTypes.keyword),
      -1, // @link
      0,
      6,
      6,
      tokenIndex(SemanticTokenTypes.variable),
      -1, // common
      0,
      7,
      1,
      tokenIndex(SemanticTokenTypes.operator),
      -1, // =
      0,
      2,
      11,
      tokenIndex(SemanticTokenTypes.string),
      -1, // ./to_import
      // third line
      1,
      0,
      5,
      tokenIndex(SemanticTokenTypes.keyword),
      -1, // @link
      0,
      6,
      7,
      tokenIndex(SemanticTokenTypes.variable),
      -1, // common2
      0,
      7,
      1,
      tokenIndex(SemanticTokenTypes.operator),
      -1, // =
      0,
      1,
      9,
      tokenIndex(SemanticTokenTypes.string),
      -1, // to_import
      // fourth line
      1,
      0,
      5,
      tokenIndex(SemanticTokenTypes.keyword),
      -1, // @link
      0,
      10,
      7,
      tokenIndex(SemanticTokenTypes.variable),
      -1, // common3
      0,
      14,
      1,
      tokenIndex(SemanticTokenTypes.operator),
      -1, // =
      0,
      4,
      40,
      tokenIndex(SemanticTokenTypes.string),
      -1, // res://test/dialogue_samples/to_import.clyde
      // fifth line
      1,
      0,
      5,
      tokenIndex(SemanticTokenTypes.keyword),
      -1, // @link
    ]);
  });

  it("tests defensive scenario without lenght and value", () => {
    // this is not a valid scenario, as tokens without length or value are not assigned semantic tokens
    // however, the current type system does not guarantee that, so let's be defensive and not
    // blow things up if we happen to configure one incorrectly

    const doc = new WorkingDocument("fake_uri");
    doc.updateContent(sampleContent);

    vi.spyOn(doc, "getTokens").mockReturnValue([
      {
        token: Lexer.TOKENS.SPEAKER, // A speaker in a normal scenario will have length and value
        line: 1,
        column: 2,
      },
    ]);

    const response = buildSemanticResponseForDocument(doc);

    // speaker will have length 0
    expect(response.data).toEqual([1, 2, 0, tokenIndex(SemanticTokenTypes.string), -1]);
  });
});

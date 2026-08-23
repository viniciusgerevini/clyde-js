import { describe, expect, it, beforeEach } from "vitest";
import type { PrepareRenameParams, RenameParams } from "vscode-languageserver";
import { WorkingDocument } from "../document/working_document";
import { onPrepareRenameRequest, onRenameRequest } from "./renames";

describe("Renames", () => {
  const docUri = "file:///a.clyde";
  const docContent = `
player: this is a test #tag1 #tag2
npc: this is another one #tag2 #tag3

player: testing again #tag21

== this block
block
-> another block

== another block
block
-> this block

== that block
block
-> another block

-> @external_block.that will be ignored

`;
  let doc: WorkingDocument;
  beforeEach(() => {
    doc = new WorkingDocument(docUri);
  });

  describe("onPrepareRenameRequest", () => {
    const createPrepareParams = ({
      line,
      character,
    }: {
      line: number;
      character: number;
    }): PrepareRenameParams => {
      return {
        textDocument: { uri: docUri },
        position: {
          line,
          character,
        },
      };
    };

    it.each([
      ["tag", { line: 1, character: 26 }, 24, 28],
      ["right tag when multiple tags in line", { line: 1, character: 30 }, 30, 34],
      ["speaker", { line: 2, character: 1 }, 0, 3],
      ["divert", { line: 16, character: 6 }, 3, 16],
      ["block", { line: 10, character: 5 }, 3, 16],
    ])("returns range for %s", (_token, cursorPosition, rangeStartColumn, rangeEndColumn) => {
      doc.updateContent(docContent);
      const params = createPrepareParams(cursorPosition);

      const result = onPrepareRenameRequest(params, doc);

      expect(result).toEqual({
        start: { line: cursorPosition.line, character: rangeStartColumn },
        end: { line: cursorPosition.line, character: rangeEndColumn },
      });
    });

    it("returns undefined for divert to external as it's not supported for now", () => {
      doc.updateContent(docContent);
      const params = createPrepareParams({ line: 18, character: 3 });

      const result = onPrepareRenameRequest(params, doc);

      expect(result).toBeUndefined();
    });

    it("returns undefined if token does not support rename", () => {
      doc.updateContent(docContent);
      const params = createPrepareParams({ line: 1, character: 14 });

      const result = onPrepareRenameRequest(params, doc);

      expect(result).toBeUndefined();
    });

    it("returns undefined if position provided does not match any token", () => {
      doc.updateContent(docContent);
      // cursor position bigger than actual line length
      const params = createPrepareParams({ line: 1, character: 60 });

      const result = onPrepareRenameRequest(params, doc);

      expect(result).toBeUndefined();
    });
  });

  describe("onRenameRequest", () => {
    const createRenameParams = ({
      newName,
      line,
      character,
    }: {
      newName: string;
      line: number;
      character: number;
    }): RenameParams => {
      return {
        textDocument: { uri: docUri },
        newName,
        position: {
          line,
          character,
        },
      };
    };

    it.each([
      [
        "tag",
        "another_tag",
        { line: 1, character: 30 },
        [
          { line: 1, columnStart: 30, columnEnd: 34 },
          { line: 2, columnStart: 26, columnEnd: 30 },
        ],
      ],

      [
        "speaker",
        "new player name",
        { line: 1, character: 3 },
        [
          { line: 1, columnStart: 0, columnEnd: 6 },
          { line: 4, columnStart: 0, columnEnd: 6 },
        ],
      ],

      [
        "divert",
        "new block name",
        { line: 8, character: 3 },
        [
          { line: 8, columnStart: 3, columnEnd: 16 },
          { line: 10, columnStart: 3, columnEnd: 16 },
          { line: 16, columnStart: 3, columnEnd: 16 },
        ],
      ],

      [
        "block",
        "new block name",
        { line: 6, character: 4 },
        [
          { line: 6, columnStart: 3, columnEnd: 13 },
          { line: 12, columnStart: 3, columnEnd: 13 },
        ],
      ],
    ])("return matching tokens for %s", (_token, newName, cursorPosition, matchingRanges) => {
      doc.updateContent(docContent);
      const params = createRenameParams({
        newName: newName,
        line: cursorPosition.line,
        character: cursorPosition.character,
      });

      const result = onRenameRequest(params, doc);

      expect(result).toEqual({
        changes: {
          [doc.getDocumentUri()]: matchingRanges.map((r) => ({
            newText: newName,
            range: {
              start: {
                line: r.line,
                character: r.columnStart,
              },
              end: {
                line: r.line,
                character: r.columnEnd,
              },
            },
          })),
        },
      });
    });

    it.each([
      ["tag", "another tag", { line: 1, character: 30 }],
      ["speaker", "new $ name", { line: 1, character: 3 }],
      ["divert", "new {} name", { line: 8, character: 3 }],
      ["block", "new {} block", { line: 6, character: 4 }],
    ])(
      "returns undefined when new name is not allowed for %s",
      (_token, wrongNewName, cursorPosition) => {
        doc.updateContent(docContent);
        const params = createRenameParams({
          newName: wrongNewName,
          line: cursorPosition.line,
          character: cursorPosition.character,
        });

        const result = onRenameRequest(params, doc);

        expect(result).toBeUndefined();
      },
    );

    it("returns undefined when requested rename position not found", () => {
      // this case should never happen as the prepare stage should have skipped any
      // token not allowed. However, as prepare and rename are two separate requests
      // I'm being defensive and making sure if this ever happened, at least it won't
      // iterage over the whole file to find out
      doc.updateContent(docContent);
      const params = createRenameParams({ newName: "something", line: 0, character: 0 });

      const result = onRenameRequest(params, doc);

      expect(result).toBeUndefined();
    });

    it("returns undefined when requested rename position not found", () => {
      // like the one aboce, this is a safeguard and should never happen
      doc.updateContent(docContent);
      const params = createRenameParams({ newName: "something", line: 1, character: 22 });

      const result = onRenameRequest(params, doc);

      expect(result).toBeUndefined();
    });
  });
});

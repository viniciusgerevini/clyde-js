import { describe, expect, it, beforeEach, vi, Mock, afterEach } from "vitest";
import fs from "node:fs";
import { type CompletionParams, CompletionItemKind } from "vscode-languageserver/node";
import { getCompletionOptions } from "./completion";

import { WorkingDocument } from "../document/working_document";

describe("Completion", () => {
  const docUri = "file:///a.clyde";
  let doc: WorkingDocument;
  // let existsSyncStub: Mock;
  // let readFileSyncStub: Mock;
  //
  //
  const createParams = ({
    line,
    character,
  }: {
    line: number;
    character: number;
  }): CompletionParams => {
    return {
      textDocument: { uri: docUri },
      position: {
        line,
        character,
      },
    };
  };

  beforeEach(() => {
    doc = new WorkingDocument(docUri);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns no options when completion requested outside triggers", () => {
    const params = createParams({ line: 2, character: 0 });

    doc.updateContent(`(\n   \n`);

    const completion = getCompletionOptions(params, doc);

    expect(completion).toEqual([]);
  });

  describe("Diverts", () => {
    it("returns all blocks and links", () => {
      vi.useFakeTimers();
      const params = createParams({ line: 10, character: 4 });

      doc.updateContent(`
@link link_a
@link link_b

== block_a
h

== block_b
h

-> 
`);
      vi.advanceTimersByTime(1000);

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual([
        {
          label: "block_a",
          kind: CompletionItemKind.Reference,
          labelDetails: { description: "Block" },
        },
        {
          label: "block_b",
          kind: CompletionItemKind.Reference,
          labelDetails: { description: "Block" },
        },
        {
          label: "END",
          kind: CompletionItemKind.Keyword,
        },
        {
          label: "@link_a",
          kind: CompletionItemKind.Reference,
          labelDetails: { description: "File" },
        },
        {
          label: "@link_b",
          kind: CompletionItemKind.Reference,
          labelDetails: { description: "File" },
        },
      ]);
    });

    it("filters and shows blocks only when regular text", () => {
      vi.useFakeTimers();
      const params = createParams({ line: 10, character: 6 });

      doc.updateContent(`
@link link_a
@link link_b

== block_a
h

== block_b
h

-> _a
`);
      vi.advanceTimersByTime(1000);

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual([
        {
          label: "block_a",
          kind: CompletionItemKind.Reference,
          labelDetails: { description: "Block" },
        },
      ]);
    });

    it("filters and shows links only when search test starts with @", () => {
      vi.useFakeTimers();
      const params = createParams({ line: 10, character: 5 });

      doc.updateContent(`
@link link_a
@link link_b

== block_a
h

== block_b
h

-> @_a
`);
      vi.advanceTimersByTime(1000);

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual([
        {
          label: "@link_a",
          kind: CompletionItemKind.Reference,
          labelDetails: { description: "File" },
        },
      ]);
    });
  });

  describe("Variations", () => {
    it("returns all variations options", () => {
      const params = createParams({ line: 0, character: 1 });

      doc.updateContent("( ");

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual([
        {
          label: "shuffle",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
        {
          label: "cycle",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
        {
          label: "once",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
        {
          label: "sequence",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
        {
          label: "shuffle cycle",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
        {
          label: "shuffle once",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
        {
          label: "shuffle sequence",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
      ]);
    });

    it("filters options", () => {
      const params = createParams({ line: 0, character: 5 });

      doc.updateContent("( cyc ");

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual([
        {
          label: "cycle",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
        {
          label: "shuffle cycle",
          kind: CompletionItemKind.Keyword,
          labelDetails: { description: "variation mode" },
        },
      ]);
    });
  });

  describe("Speakers", () => {
    it("returns all speakers in the document without duplicates", () => {
      const cursorPosition = { line: 6, character: 1 };
      const params = createParams(cursorPosition);

      doc.updateContent(`
vini: Hey
vincent: Hello
jules: hi
jules: hello
vincent: me again
:
vini: another one
`);

      const expectedCompletion = ["vini", "vincent", "jules"].map((name) => {
        return {
          label: name,
          kind: CompletionItemKind.Variable,
          labelDetails: { description: "Speaker" },
          textEdit: {
            newText: `${name}: `,
            insert: {
              start: {
                line: cursorPosition.line,
                character: cursorPosition.character - 1,
              },
              end: cursorPosition,
            },
            replace: {
              start: cursorPosition,
              end: cursorPosition,
            },
          },
        };
      });

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual(expectedCompletion);
    });

    it("filters speakers", () => {
      const cursorPosition = { line: 4, character: 17 };
      const params = createParams(cursorPosition);

      doc.updateContent(`
vini: Hey
vincent: Hello
jules: hi
{ is_true } :Vin 
vini: another one
`);

      const expectedCompletion = ["vini", "vincent"].map((name) => {
        return {
          label: name,
          kind: CompletionItemKind.Variable,
          labelDetails: { description: "Speaker" },
          textEdit: {
            newText: `${name}: `,
            insert: {
              start: {
                line: cursorPosition.line,
                character: cursorPosition.character - 1,
              },
              end: cursorPosition,
            },
            replace: {
              start: cursorPosition,
              end: cursorPosition,
            },
          },
        };
      });

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual(expectedCompletion);
    });
  });

  describe("Tags", () => {
    it("returns all tags in the document without duplicates", () => {
      const cursorPosition = { line: 4, character: 14 };
      const params = createParams(cursorPosition);

      doc.updateContent(`
vini: Hey #tag1
vincent: Hello #tag2 #tag1
jules: hi #happy #sad
jules: hello #
`);

      const expectedCompletion = ["tag1", "tag2", "happy", "sad"].map((label) => {
        return {
          label: `#${label}`,
          insertText: label,
          kind: CompletionItemKind.Variable,
          labelDetails: { description: "Tag" },
        };
      });

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual(expectedCompletion);
    });

    it("filters tags", () => {
      const cursorPosition = { line: 4, character: 17 };
      const params = createParams(cursorPosition);

      doc.updateContent(`
vini: Hey #tag1
vincent: Hello #tag2 #tag1
jules: hi #happy #sad
jules: hello #ta
`);

      const expectedCompletion = ["tag1", "tag2", "ta"].map((label) => {
        return {
          label: `#${label}`,
          insertText: label,
          kind: CompletionItemKind.Variable,
          labelDetails: { description: "Tag" },
        };
      });

      const completion = getCompletionOptions(params, doc);

      expect(completion).toEqual(expectedCompletion);
    });
  });
});

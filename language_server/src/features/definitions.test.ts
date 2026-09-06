import { describe, expect, it, beforeEach, vi, Mock, afterEach } from "vitest";
import fs from "node:fs";
import { type DefinitionParams } from "vscode-languageserver/node";

import { onDefinitionRequest } from "./definitions";
import { WorkingDocument } from "../document/working_document";

describe("Go to definition", () => {
  const docUri = "file:///a.clyde";
  let doc: WorkingDocument;
  let existsSyncStub: Mock;
  let readFileSyncStub: Mock;

  const createParams = ({
    line,
    character,
  }: {
    line: number;
    character: number;
  }): DefinitionParams => {
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
    existsSyncStub = vi.spyOn(fs, "existsSync");
    readFileSyncStub = vi.spyOn(fs, "readFileSync");

    existsSyncStub.mockReturnValue(false);
    readFileSyncStub.mockReturnValue("");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("onDefinitionRequest", () => {
    it("returns undefined when position has no definitions avaialble", () => {
      const params = createParams({ line: 0, character: 2 });
      doc.updateContent("this is a regular dialogue line");
      expect(onDefinitionRequest(params, doc)).toBeUndefined();
    });

    it("returns link to block when position is in a divert block", () => {
      const params = createParams({ line: 8, character: 5 });
      doc.updateContent(`
apple

== block 1
banana

== block 2
123
-> block 1
`);
      expect(onDefinitionRequest(params, doc)).toEqual([
        {
          originSelectionRange: {
            start: {
              line: 8,
              character: 0,
            },
            end: {
              line: 8,
              character: 10,
            },
          },
          targetUri: docUri,
          targetRange: {
            start: {
              line: 3,
              character: 0,
            },
            end: {
              line: 3,
              character: 10,
            },
          },
          targetSelectionRange: {
            start: {
              line: 3,
              character: 3,
            },
            end: {
              line: 3,
              character: 10,
            },
          },
        },
      ]);
    });

    it("returns undefined when position line has divert but not under current character", () => {
      doc.updateContent(`
== block 1
a
* test 
    -> block 1 { something }
`);

      const paramsBefore = createParams({ line: 4, character: 0 });
      const paramsAfter = createParams({ line: 4, character: 20 });

      expect(onDefinitionRequest(paramsBefore, doc)).toBeUndefined();
      expect(onDefinitionRequest(paramsAfter, doc)).toBeUndefined();
    });

    it("returns undefined when position line is out of content range", () => {
      doc.updateContent(`
== block 1
a
-> block 1
`);
      const params = createParams({ line: 99, character: 0 });

      expect(onDefinitionRequest(params, doc)).toBeUndefined();
    });

    it("returns undefined when block does not exist", () => {
      doc.updateContent(`-> block 1`);
      const params = createParams({ line: 0, character: 5 });

      expect(onDefinitionRequest(params, doc)).toBeUndefined();
    });

    it("returns link to file with default position when divert has no block definition", () => {
      vi.useFakeTimers();

      const params = createParams({ line: 3, character: 5 });
      doc.updateContent(`
@link another_file = ./another.clyde

-> @another_file
`);
      vi.advanceTimersByTime(1000);

      expect(onDefinitionRequest(params, doc)).toEqual([
        {
          originSelectionRange: {
            start: {
              line: 3,
              character: 0,
            },
            end: {
              line: 3,
              character: 16,
            },
          },
          targetUri: "file:///another.clyde",
          targetRange: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 0,
            },
          },
          targetSelectionRange: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 0,
            },
          },
        },
      ]);
      expect(existsSyncStub).not.toHaveBeenCalled();
    });

    it("returns link to file with default position when file does not exist", () => {
      vi.useFakeTimers();
      existsSyncStub.mockReturnValue(false);

      const params = createParams({ line: 3, character: 5 });
      doc.updateContent(`
@link another_file = ./another.clyde

-> @another_file.block_1
`);
      vi.advanceTimersByTime(1000);

      expect(onDefinitionRequest(params, doc)).toEqual([
        {
          originSelectionRange: {
            start: {
              line: 3,
              character: 0,
            },
            end: {
              line: 3,
              character: 24,
            },
          },
          targetUri: "file:///another.clyde",
          targetRange: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 0,
            },
          },
          targetSelectionRange: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 0,
            },
          },
        },
      ]);
      expect(existsSyncStub).toHaveBeenCalledWith("/another.clyde");
    });

    it("returns link to file with block position when file is avaialbe", () => {
      const otherFileContent = `
== block_1
this
`;
      vi.useFakeTimers();
      existsSyncStub.mockReturnValue(true);
      readFileSyncStub.mockReturnValue(otherFileContent);

      const params = createParams({ line: 3, character: 5 });
      doc.updateContent(`
@link another_file = ./another.clyde

-> @another_file.block_1
`);
      vi.advanceTimersByTime(1000);

      expect(onDefinitionRequest(params, doc)).toEqual([
        {
          originSelectionRange: {
            start: {
              line: 3,
              character: 0,
            },
            end: {
              line: 3,
              character: 24,
            },
          },
          targetUri: "file:///another.clyde",
          targetRange: {
            start: {
              line: 1,
              character: 0,
            },
            end: {
              line: 1,
              character: 10,
            },
          },
          targetSelectionRange: {
            start: {
              line: 1,
              character: 3,
            },
            end: {
              line: 1,
              character: 10,
            },
          },
        },
      ]);
      expect(existsSyncStub).toHaveBeenCalledWith("/another.clyde");
      expect(readFileSyncStub).toHaveBeenCalledWith("/another.clyde", "utf8");
    });

    it("returns link to file with default position when fails to read file", () => {
      vi.useFakeTimers();
      existsSyncStub.mockReturnValue(true);
      readFileSyncStub.mockThrow(new Error("planned test error"));

      const params = createParams({ line: 2, character: 5 });
      doc.updateContent(`
@link another_file = ./another.clyde
-> @another_file.block_1
`);
      vi.advanceTimersByTime(1000);

      expect(onDefinitionRequest(params, doc)).toEqual([
        {
          originSelectionRange: {
            start: {
              line: 2,
              character: 0,
            },
            end: {
              line: 2,
              character: 24,
            },
          },
          targetUri: "file:///another.clyde",
          targetRange: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 0,
            },
          },
          targetSelectionRange: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 0,
            },
          },
        },
      ]);
      expect(existsSyncStub).toHaveBeenCalled();
      expect(readFileSyncStub).toHaveBeenCalledWith("/another.clyde", "utf8");
    });

    it("returns undefined when file link does not exist", () => {
      doc.updateContent(`-> @file `);
      const params = createParams({ line: 0, character: 5 });

      expect(onDefinitionRequest(params, doc)).toBeUndefined();
    });
  });
});

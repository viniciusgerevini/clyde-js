import { describe, it, vi, beforeEach, Mock, expect, afterEach } from "vitest";
import * as clydeParser from "@clyde-lang/parser";
import { ErrorInfo, WorkingDocument } from "./working_document";
import * as configModule from "../config";

describe("Working Document", () => {
  const testDocumentUri = "file:///a/b/fake_document";
  let parseFinishedCallbackStub: Mock;
  let workingDocument: WorkingDocument;

  beforeEach(() => {
    parseFinishedCallbackStub = vi.fn();
    workingDocument = new WorkingDocument(testDocumentUri);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("updates content and triggers parsing", () => {
    vi.useFakeTimers();
    workingDocument.addParseFinishedListener(parseFinishedCallbackStub);
    const documentContent = "Hello there!";

    workingDocument.updateContent(documentContent);

    // give time for parse to kick in
    vi.advanceTimersByTime(1000);

    expect(workingDocument.getContent()).toBe(documentContent);
    expect(parseFinishedCallbackStub).toHaveBeenCalled();
  });

  it("debounces parsing", () => {
    vi.useFakeTimers();
    workingDocument.addParseFinishedListener(parseFinishedCallbackStub);

    workingDocument.updateContent("content 1");
    workingDocument.updateContent("content 2");
    workingDocument.updateContent("content 3");

    expect(parseFinishedCallbackStub).not.toHaveBeenCalled();

    // give enough time to debounce
    vi.advanceTimersByTime(1000);

    expect(parseFinishedCallbackStub).toHaveBeenCalledTimes(1);

    // one more outside debounce window
    workingDocument.updateContent("content 4");

    vi.advanceTimersByTime(1000);

    expect(parseFinishedCallbackStub).toHaveBeenCalledTimes(2);
  });

  it("notifies listeners when parse is finished", () => {
    const secondListenerStub = vi.fn();
    vi.useFakeTimers();
    workingDocument.addParseFinishedListener(parseFinishedCallbackStub);
    workingDocument.addParseFinishedListener(secondListenerStub);

    const documentContent = "Hello there!";
    workingDocument.updateContent(documentContent);
    // give time for parse to kick in
    vi.advanceTimersByTime(1000);

    expect(parseFinishedCallbackStub).toHaveBeenCalledWith(undefined);
    expect(secondListenerStub).toHaveBeenCalledWith(undefined);
  });

  it("notifies listeners when parse fails", () => {
    const secondListenerStub = vi.fn();
    vi.useFakeTimers();
    workingDocument.addParseFinishedListener(parseFinishedCallbackStub);
    workingDocument.addParseFinishedListener(secondListenerStub);

    const documentContent = "vini: this is a wrong: syntax";
    const errorInfo: ErrorInfo = {
      start: { line: 0, character: 6 },
      end: { line: 0, character: 22 },
      details: 'Unexpected token "<speaker name>:" on line 1 column 7. Expected text ',
    };

    workingDocument.updateContent(documentContent);
    // give time for parse to kick in
    vi.advanceTimersByTime(1000);

    expect(parseFinishedCallbackStub).toHaveBeenCalledWith(errorInfo);
    expect(secondListenerStub).toHaveBeenCalledWith(errorInfo);
  });

  it("notifies listeners when parse fails (handle token with no length)", () => {
    const secondListenerStub = vi.fn();
    vi.useFakeTimers();
    workingDocument.addParseFinishedListener(parseFinishedCallbackStub);
    workingDocument.addParseFinishedListener(secondListenerStub);

    const documentContent = "{{}";
    const errorInfo: ErrorInfo = {
      start: { line: 0, character: 1 },
      end: { line: 0, character: 1 },
      details: 'Unexpected token "{" on line 1 column 2. Expected } ',
    };

    workingDocument.updateContent(documentContent);
    // give time for parse to kick in
    vi.advanceTimersByTime(1000);

    expect(parseFinishedCallbackStub).toHaveBeenCalledWith(errorInfo);
    expect(secondListenerStub).toHaveBeenCalledWith(errorInfo);
  });

  it("notifies listeners when parse fails with unexpected error", () => {
    vi.spyOn(clydeParser, "parse").mockThrow(new Error("unexpected error"));

    vi.useFakeTimers();
    workingDocument.addParseFinishedListener(parseFinishedCallbackStub);

    // forcing an invalid content to cause an unexpcted error
    const documentContent = 1234 as unknown as string;
    const errorInfo: ErrorInfo = {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
      details: "File parsing failed",
    };

    workingDocument.updateContent(documentContent);
    // give time for parse to kick in
    vi.advanceTimersByTime(1000);

    expect(parseFinishedCallbackStub).toHaveBeenCalledWith(errorInfo);
  });

  it("returns all lexical tokens for document", () => {
    const documentContent = "vini: Hello there! #intro";
    const expectedTokensForDocument = [
      { token: "SPEAKER", line: 0, column: 0, value: "vini", length: 5 },
      { token: "TEXT", line: 0, column: 6, value: "Hello there!" },
      { token: "TAG", line: 0, column: 19, value: "intro", length: 6 },
      { token: "EOF", line: 0, column: 25 },
    ];

    workingDocument.updateContent(documentContent);

    expect(workingDocument.getTokens()).toEqual(expectedTokensForDocument);
  });

  it("cache tokens until content is updated", () => {
    const documentContent = "vini: Hello";

    workingDocument.updateContent(documentContent);

    const tokens = workingDocument.getTokens();
    const sameTokens = workingDocument.getTokens();

    workingDocument.updateContent(documentContent);

    const differentTokens = workingDocument.getTokens();

    expect(tokens).toBe(sameTokens);
    expect(tokens).not.toBe(differentTokens);
  });

  it("returns empty tokens list when document is empty", () => {
    workingDocument.updateContent("");
    expect(workingDocument.getTokens()).toEqual([]);
  });

  it("returns block names", () => {
    vi.useFakeTimers();
    const documentContent = `
== block one
hello

== block two
hi

== block three
he
`;
    workingDocument.updateContent(documentContent);
    vi.advanceTimersByTime(1000);

    expect(workingDocument.getBlocksNames()).toEqual(["block one", "block two", "block three"]);
  });

  it("returns empty blocks when no parsed document", () => {
    expect(workingDocument.getBlocksNames()).toEqual([]);
  });

  it("returns block position by name", () => {
    const documentContent = `
== block one
hello

== block two
hi
`;
    workingDocument.updateContent(documentContent);

    const blockPosition = workingDocument.getBlockPosition("block two");

    expect(blockPosition).toEqual({ line: 4, column: 0, length: 12 });
  });

  it("returns undefined if block not found", () => {
    const documentContent = `== block one
hello
`;
    workingDocument.updateContent(documentContent);

    const blockPosition = workingDocument.getBlockPosition("block two");

    expect(blockPosition).toBe(undefined);
  });

  it("returns links", () => {
    const documentContent = `
@link another_file
@link one_other_file
`;
    workingDocument.updateContent(documentContent);

    expect(workingDocument.getLinks()).toEqual({
      another_file: "another_file",
      one_other_file: "one_other_file",
    });
  });

  it("gets link by name", () => {
    const documentContent = `
@link another_file = ../banana.clyde
@link one_other_file
`;
    workingDocument.updateContent(documentContent);

    expect(workingDocument.getLink("another_file")).toEqual("../banana.clyde");
  });

  it("gets undefined if link does not exist", () => {
    vi.useFakeTimers();
    const documentContent = `
@link another_file = ../banana.clyde
@link one_other_file
`;
    workingDocument.updateContent(documentContent);
    vi.advanceTimersByTime(1000);

    expect(workingDocument.getLink("something_else")).toBeUndefined();
  });

  it("gets link as document uri", () => {
    vi.useFakeTimers();
    vi.spyOn(configModule, "getFileUriInDefaultDialogueFolder").mockImplementation((uri) => {
      return new URL(uri, "file:///default_folder/").href;
    });

    const documentContent = `
@link relative_file = ../relative/banana.clyde
@link absolute_file = /absolute/banana.clyde
@link file_from_default_folder
@link relative_file_without_extension = ../relative/banana
@link absolute_file_without_extension = /absolute/banana
`;
    workingDocument.updateContent(documentContent);
    vi.advanceTimersByTime(1000);

    expect(workingDocument.getLinkDocumentUri("absolute_file")).toEqual(
      "file:///absolute/banana.clyde",
    );
    expect(workingDocument.getLinkDocumentUri("relative_file")).toEqual(
      "file:///a/relative/banana.clyde",
    );
    expect(workingDocument.getLinkDocumentUri("absolute_file_without_extension")).toEqual(
      "file:///absolute/banana.clyde",
    );
    expect(workingDocument.getLinkDocumentUri("relative_file_without_extension")).toEqual(
      "file:///a/relative/banana.clyde",
    );
    expect(workingDocument.getLinkDocumentUri("file_from_default_folder")).toEqual(
      "file:///default_folder/file_from_default_folder.clyde",
    );
    expect(workingDocument.getLinkDocumentUri("does_not_exist")).toBeUndefined();
  });
});

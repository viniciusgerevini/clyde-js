import { describe, it, vi, beforeEach, Mock, expect, afterEach } from "vitest";
import * as clydeParser from "@clyde-lang/parser";
import { ErrorInfo, WorkingDocument } from "./working_document";

describe("Working Document", () => {
  const testDocumentUri = "fake_document";
  let parseFinishedCallbackStub: Mock;
  let workingDocument: WorkingDocument;

  beforeEach(() => {
    parseFinishedCallbackStub = vi.fn();
    workingDocument = new WorkingDocument(testDocumentUri);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
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

  it("returns empty tokens list when document is empty", () => {
    workingDocument.updateContent("");
    expect(workingDocument.getTokens()).toEqual([]);
  });
});

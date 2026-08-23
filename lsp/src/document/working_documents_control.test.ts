import { describe, it, beforeEach, expect, afterEach, vi, Mock } from "vitest";
import { TextDocumentSyncKind } from "vscode-languageserver/node";
import { SERVER_VERSION } from "../config";

import * as semanticTokensModule from "../features/semantic_tokens.js";
import * as completionModule from "../features/completion.js";
import * as definitionsModule from "../features/definitions.js";

import { WorkingDocumentsControl } from "./working_documents_control";

describe("Working Documents Control", () => {
  const testDocUri = "file:///a.clyde";
  let workingDocuments: WorkingDocumentsControl;
  let parseCallbackStub: Mock;

  beforeEach(() => {
    parseCallbackStub = vi.fn();
    workingDocuments = new WorkingDocumentsControl(parseCallbackStub);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns service info with capabilities", () => {
    const info = workingDocuments.getInitialServerInfo();
    expect(info).toEqual({
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        completionProvider: {},
        semanticTokensProvider: {
          legend: semanticTokensModule.semanticTokensLegend,
          range: false,
          full: true,
        },
        definitionProvider: true,
      },
      serverInfo: {
        name: "Clyde",
        version: SERVER_VERSION,
      },
    });
  });

  it("initializes a new working document", () => {
    // just an initial check to ensure count is initialized correctly
    expect(workingDocuments.getDocumentCount()).toBe(0);

    const fakeDocUri = "fake_uri";
    const doc = workingDocuments.getOrInitWorkingDocument(fakeDocUri);

    expect(doc.getDocumentUri()).toBe(fakeDocUri);
    expect(workingDocuments.getDocumentCount()).toBe(1);
  });

  it("gets existing working document when already created", () => {
    const fakeDocUri = "fake_uri";
    const fakeDocUri2 = "fake_uri_2";
    const doc1 = workingDocuments.getOrInitWorkingDocument(fakeDocUri);
    const doc2 = workingDocuments.getOrInitWorkingDocument(fakeDocUri2);
    const doc1Again = workingDocuments.getOrInitWorkingDocument(fakeDocUri);

    expect(doc1.getDocumentUri()).toBe(fakeDocUri);
    expect(doc2.getDocumentUri()).toBe(fakeDocUri2);
    expect(doc1Again.getDocumentUri()).toBe(fakeDocUri);
    expect(doc1).toBe(doc1Again);
    expect(workingDocuments.getDocumentCount()).toBe(2);
  });

  it("updates document content", () => {
    const workingDocument = workingDocuments.getDocument(testDocUri);
    const content = "This is new content";

    workingDocuments.updateDocumentContent(testDocUri, content);

    expect(workingDocument.getContent()).toEqual(content);
  });

  it("calls parse callback when file is parsed", () => {
    vi.useFakeTimers();
    const content = "This is new content";

    workingDocuments.updateDocumentContent(testDocUri, content);
    vi.advanceTimersByTime(1000);

    expect(parseCallbackStub).toHaveBeenCalled();
  });

  it("gets code completion options with parameters and correct document", () => {
    const completionResult = [];
    const workingDocument = workingDocuments.getDocument(testDocUri);
    const completionParams = {
      textDocument: { uri: testDocUri },
    };

    const getCompletionStub = vi.spyOn(completionModule, "getCompletionOptions");
    getCompletionStub.mockReturnValue(completionResult);

    const result = workingDocuments.getCodeCompletionOptions(completionParams);

    expect(result).toBe(completionResult);
    expect(getCompletionStub).toHaveBeenCalledWith(completionParams, workingDocument);
  });

  it("gets definition links with parameters and correct document", () => {
    const expectedResult = [];
    const workingDocument = workingDocuments.getDocument(testDocUri);
    const params = {
      textDocument: { uri: testDocUri },
    };

    const getDefinitionLinksStub = vi.spyOn(definitionsModule, "onDefinitionRequest");
    getDefinitionLinksStub.mockReturnValue(expectedResult);

    const result = workingDocuments.getDefinitionLinks(params);

    expect(result).toBe(expectedResult);
    expect(getDefinitionLinksStub).toHaveBeenCalledWith(params, workingDocument);
  });

  it("gets semantic tokens for correct document", () => {
    const expectedResult = [];
    const workingDocument = workingDocuments.getDocument(testDocUri);

    const buildSemanticResponseStub = vi.spyOn(
      semanticTokensModule,
      "buildSemanticResponseForDocument",
    );
    buildSemanticResponseStub.mockReturnValue(expectedResult);

    const result = workingDocuments.getSemanticTokens(testDocUri);

    expect(result).toBe(expectedResult);
    expect(buildSemanticResponseStub).toHaveBeenCalledWith(workingDocument);
  });

  it("removes document from working documents", () => {
    const anotherTestDocUri = "file://b.clyde";

    // fetching inexistent documents create them
    workingDocuments.getDocument(testDocUri);
    workingDocuments.getDocument(anotherTestDocUri);
    expect(workingDocuments.getDocumentCount()).toBe(2);

    workingDocuments.removeDocument(testDocUri);
    expect(workingDocuments.getDocumentCount()).toBe(1);

    // by trying to get an existing document, the count shouldn't go up
    workingDocuments.getDocument(anotherTestDocUri);
    expect(workingDocuments.getDocumentCount()).toBe(1);
  });
});

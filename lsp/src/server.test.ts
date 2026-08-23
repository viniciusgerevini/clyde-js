import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

import * as languageServerModule from "vscode-languageserver/node";
import {
  TextDocuments,
  TextDocumentSyncKind,
  DiagnosticSeverity,
} from "vscode-languageserver/node";
import { startServer } from "./server";
import { WorkingDocumentsControl } from "./document/working_documents_control";
import * as workingDocumentsModule from "./document/working_documents_control";
import { ErrorInfo } from "./document/working_document";
import { semanticTokensLegend } from "./features/semantic_tokens";
import * as configModule from "./config";

describe("Server", () => {
  let connectionStub: {
    sendDiagnostics: Mock;
    onInitialize: Mock;
    onCompletion: Mock;
    onDefinition: Mock;
    onPrepareRename: Mock;
    onRenameRequest: Mock;
    languages: {
      semanticTokens: {
        on: Mock;
      };
    };
    listen: Mock;
  };

  let textDocumentsListenStub: Mock;

  beforeEach(() => {
    connectionStub = {
      sendDiagnostics: vi.fn(),
      onInitialize: vi.fn(),
      onCompletion: vi.fn(),
      onDefinition: vi.fn(),
      onPrepareRename: vi.fn(),
      onRenameRequest: vi.fn(),
      languages: {
        semanticTokens: {
          on: vi.fn(),
        },
      },
      listen: vi.fn(),
    };

    textDocumentsListenStub = vi.spyOn(TextDocuments.prototype, "listen");
    textDocumentsListenStub.mockReturnValue(undefined);

    vi.spyOn(languageServerModule, "createConnection").mockReturnValue(connectionStub);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("setup server", () => {
    startServer();

    expect(connectionStub.onInitialize).toHaveBeenCalled();
    expect(connectionStub.onCompletion).toHaveBeenCalled();
    expect(connectionStub.onDefinition).toHaveBeenCalled();
    expect(connectionStub.languages.semanticTokens.on).toHaveBeenCalled();
    expect(connectionStub.listen).toHaveBeenCalled();
    expect(textDocumentsListenStub).toHaveBeenCalledWith(connectionStub);
  });

  it("initialize with clyde server info", () => {
    const findAndLoadConfigSpy = vi.spyOn(configModule, "findAndLoadConfig");
    const workspaceFolders = [{ uri: "file:///project_folder" }];
    const serverInfo = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        completionProvider: {},
        semanticTokensProvider: {
          legend: semanticTokensLegend,
          range: false,
          full: true,
        },
        definitionProvider: true,
        renameProvider: {
          prepareProvider: true,
        },
        workspace: {
          workspaceFolders: {
            supported: true,
          },
        },
      },
      serverInfo: {
        name: "Clyde",
        version: configModule.SERVER_VERSION,
      },
    };

    startServer();

    expect(connectionStub.onInitialize).toHaveBeenCalled();

    const initCallback = connectionStub.onInitialize.mock.lastCall![0];
    const result = initCallback({ workspaceFolders });

    expect(result).toEqual(serverInfo);
    expect(findAndLoadConfigSpy).toHaveBeenCalled();
  });

  it("does not initialize config when workspace folders are not available", () => {
    const findAndLoadConfigSpy = vi.spyOn(configModule, "findAndLoadConfig");
    startServer();

    expect(connectionStub.onInitialize).toHaveBeenCalled();

    const initCallback = connectionStub.onInitialize.mock.lastCall![0];
    initCallback({});

    expect(findAndLoadConfigSpy).not.toHaveBeenCalled();
  });

  it("fetches code completion options on completion requested", () => {
    const fakeCompletionResponse = [{ label: "fakeCompletion" }];
    const fakeParams = { textDocument: { uri: "fake" } };
    const stubbedMethod = vi.spyOn(WorkingDocumentsControl.prototype, "getCodeCompletionOptions");
    stubbedMethod.mockReturnValue(fakeCompletionResponse);

    startServer();

    expect(connectionStub.onCompletion).toHaveBeenCalled();

    const callback = connectionStub.onCompletion.mock.lastCall![0];
    const result = callback(fakeParams);

    expect(result).toEqual(fakeCompletionResponse);
    expect(stubbedMethod).toHaveBeenCalledWith(fakeParams);
  });

  it("fetches definition links when definition requested", () => {
    const fakeDefinitionResponse = [{ label: "fake response" }];
    const fakeParams = { textDocument: { uri: "fake" } };
    const stubbedMethod = vi.spyOn(WorkingDocumentsControl.prototype, "getDefinitionLinks");
    stubbedMethod.mockReturnValue(fakeDefinitionResponse);

    startServer();

    expect(connectionStub.onDefinition).toHaveBeenCalled();

    const callback = connectionStub.onDefinition.mock.lastCall![0];
    const result = callback(fakeParams);

    expect(result).toEqual(fakeDefinitionResponse);
    expect(stubbedMethod).toHaveBeenCalledWith(fakeParams);
  });

  it("fetches semantic tokens when requested", () => {
    const fakeTokensResponse = [{ label: "fake response" }];
    const fakeParams = { textDocument: { uri: "fake" } };
    const stubbedMethod = vi.spyOn(WorkingDocumentsControl.prototype, "getSemanticTokens");
    stubbedMethod.mockReturnValue(fakeTokensResponse);

    startServer();

    expect(connectionStub.languages.semanticTokens.on).toHaveBeenCalled();

    const callback = connectionStub.languages.semanticTokens.on.mock.lastCall![0];
    const result = callback(fakeParams);

    expect(result).toEqual(fakeTokensResponse);
    expect(stubbedMethod).toHaveBeenCalledWith(fakeParams.textDocument.uri);
  });

  it("fetches rename prepare check data", () => {
    const fakeResponse = [{ label: "fake response" }];
    const fakeParams = { textDocument: { uri: "fake" } };
    const stubbedMethod = vi.spyOn(WorkingDocumentsControl.prototype, "getPrepareRenameCheck");
    stubbedMethod.mockReturnValue(fakeResponse);

    startServer();

    expect(connectionStub.onPrepareRename).toHaveBeenCalled();

    const callback = connectionStub.onPrepareRename.mock.lastCall![0];
    const result = callback(fakeParams);

    expect(result).toEqual(fakeResponse);
    expect(stubbedMethod).toHaveBeenCalledWith(fakeParams);
  });

  it("fetches rename edits", () => {
    const fakeResponse = [{ label: "fake response" }];
    const fakeParams = { textDocument: { uri: "fake" } };
    const stubbedMethod = vi.spyOn(WorkingDocumentsControl.prototype, "getRenameEdit");
    stubbedMethod.mockReturnValue(fakeResponse);

    startServer();

    expect(connectionStub.onRenameRequest).toHaveBeenCalled();

    const callback = connectionStub.onRenameRequest.mock.lastCall![0];
    const result = callback(fakeParams);

    expect(result).toEqual(fakeResponse);
    expect(stubbedMethod).toHaveBeenCalledWith(fakeParams);
  });

  it("removes document when closed", () => {
    const fakeParams = { document: { uri: "fake" } };
    const stubbedMethod = vi.spyOn(WorkingDocumentsControl.prototype, "removeDocument");
    stubbedMethod.mockReturnValue(undefined);

    const fakeDidClose = vi.fn();
    vi.spyOn(TextDocuments.prototype, "onDidClose", "get").mockImplementation(() => {
      return fakeDidClose;
    });

    startServer();

    expect(fakeDidClose).toHaveBeenCalled();

    const callback = fakeDidClose.mock.lastCall![0];
    callback(fakeParams);

    expect(stubbedMethod).toHaveBeenCalledWith(fakeParams.document.uri);
  });

  it("updates document content when document changes", () => {
    const fakeText = "some fake content";
    const fakeParams = {
      document: {
        uri: "fake",
        getText() {
          return fakeText;
        },
      },
    };
    const stubbedMethod = vi.spyOn(WorkingDocumentsControl.prototype, "updateDocumentContent");
    stubbedMethod.mockReturnValue(undefined);

    const fakeDidChange = vi.fn();
    vi.spyOn(TextDocuments.prototype, "onDidChangeContent", "get").mockImplementation(() => {
      return fakeDidChange;
    });

    startServer();

    expect(fakeDidChange).toHaveBeenCalled();

    const callback = fakeDidChange.mock.lastCall![0];
    callback(fakeParams);

    expect(stubbedMethod).toHaveBeenCalledWith(fakeParams.document.uri, fakeText);
  });

  it("reports diagnostics when parse returns errors", () => {
    const fakeDocUri = "file:///a.clyde";
    const error: ErrorInfo = {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
      details: "some error",
    };
    const stubbedWorkingDocumentsClass = vi.spyOn(
      workingDocumentsModule,
      "WorkingDocumentsControl",
    );

    startServer();

    expect(stubbedWorkingDocumentsClass).toHaveBeenCalled();
    const onParseCallback = stubbedWorkingDocumentsClass.mock.lastCall![0];
    onParseCallback(fakeDocUri, error);

    expect(connectionStub.sendDiagnostics).toHaveBeenCalledWith({
      diagnostics: [
        {
          message: error.details,
          range: {
            start: error.start,
            end: error.end,
          },
          severity: DiagnosticSeverity.Error,
          source: "Clyde LS",
        },
      ],
      uri: fakeDocUri,
    });
  });

  it("reports no diagnostics when parse does not return any errors", () => {
    const fakeDocUri = "file:///a.clyde";
    const stubbedWorkingDocumentsClass = vi.spyOn(
      workingDocumentsModule,
      "WorkingDocumentsControl",
    );

    startServer();

    expect(stubbedWorkingDocumentsClass).toHaveBeenCalled();
    const onParseCallback = stubbedWorkingDocumentsClass.mock.lastCall![0];
    onParseCallback(fakeDocUri, undefined);

    expect(connectionStub.sendDiagnostics).toHaveBeenCalledWith({
      diagnostics: [],
      uri: fakeDocUri,
    });
  });
});

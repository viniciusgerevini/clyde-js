import {
  createConnection,
  TextDocumentSyncKind,
  TextDocuments,
  type TextDocumentChangeEvent,
  type InitializeResult,
  type CompletionItem,
  Diagnostic,
  DiagnosticSeverity,
  type CompletionParams,
  CompletionList,
  type DefinitionParams,
  type Definition,
  type DefinitionLink,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { getLogger } from "./utils/logger.js";
import {
  buildSemanticResponseForDocument,
  semanticTokensLegend,
} from "./features/semantic_tokens.js";
import { getCompletionOptions } from "./features/completion.js";
import { onDefinitionRequest } from "./features/definitions.js";
import { WorkingDocumentsControl } from "./document/working_documents_control.js";
import { type ErrorInfo } from "./document/working_document.js";
import { SERVER_VERSION } from "./config.js";

// TODO turn this into a proper class that can be tested

const connection = createConnection();

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const workingDocuments: WorkingDocumentsControl = new WorkingDocumentsControl(onParseFinished);

const logger = getLogger();

connection.onInitialize(() => {
  logger.info("Server initializing");

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {},
      semanticTokensProvider: {
        legend: semanticTokensLegend,
        range: false,
        full: true,
      },
      definitionProvider: true,

      // TODO renameProvider?: boolean | RenameOptions;
      // - rename speakers, tags and blocks
    },
    serverInfo: {
      name: "Clyde",
      version: SERVER_VERSION,
    },
  };

  return result;
});

documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
  logger.info("File closed", { uri: event.document.uri });
  workingDocuments.removeWorkingDocument(event.document.uri);
});

documents.onDidChangeContent((change) => {
  logger.info("File content changed", { uri: change.document.uri });
  const workingDocument = workingDocuments.getOrInitWorkingDocument(change.document.uri);
  workingDocument.updateContent(change.document.getText());
});

connection.onCompletion((completionParams: CompletionParams): CompletionItem[] | CompletionList => {
  logger.debug("Completion requested", {
    uri: completionParams.textDocument.uri,
    completionParams,
  });
  const workingDocument = workingDocuments.getOrInitWorkingDocument(
    completionParams.textDocument.uri,
  );

  const results = getCompletionOptions(completionParams, workingDocument);

  return results;
});

connection.onDefinition((params: DefinitionParams): Definition | DefinitionLink[] | undefined => {
  const workingDocument = workingDocuments.getOrInitWorkingDocument(params.textDocument.uri);
  return onDefinitionRequest(params, workingDocument);
});

connection.languages.semanticTokens.on((params) => {
  logger.debug("Semantic tokens requested", { uri: params.textDocument.uri });
  const workingDocument = workingDocuments.getOrInitWorkingDocument(params.textDocument.uri);
  return buildSemanticResponseForDocument(workingDocument);
});

documents.listen(connection);

connection.listen();

function onParseFinished(uri: string, error: ErrorInfo | undefined): void {
  if (error) {
    let diagnostics: Diagnostic[] = [];
    let diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: error.start,
        end: error.end,
      },
      message: error.details,
      source: "Clyde LS",
    };

    diagnostics.push(diagnostic);
    logger.debug("Send diagnostics", { diagnostics });
    connection.sendDiagnostics({ uri, diagnostics });
  } else {
    logger.debug("Clear diagnostics");
    connection.sendDiagnostics({ uri, diagnostics: [] });
  }
}

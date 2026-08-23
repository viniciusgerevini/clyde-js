import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { getLogger } from "./utils/logger.js";
import { type ErrorInfo } from "./document/working_document.js";
import { WorkingDocumentsControl } from "./document/working_documents_control.js";
import { semanticTokensLegend } from "./features/semantic_tokens.js";
import { findAndLoadConfig, SERVER_VERSION } from "./config.js";

export function startServer(): void {
  const connection = createConnection();
  const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
  const workingDocuments = new WorkingDocumentsControl(onParseFinished);

  const logger = getLogger();

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

  connection.onInitialize((params) => {
    logger.info("Server initializing");

    if (params.workspaceFolders) {
      findAndLoadConfig(params.workspaceFolders);
    }

    return {
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
        version: SERVER_VERSION,
      },
    };
  });

  documents.onDidClose((event) => {
    logger.info("File closed", { uri: event.document.uri });
    workingDocuments.removeDocument(event.document.uri);
  });

  documents.onDidChangeContent((change) => {
    logger.info("File content changed", { uri: change.document.uri });
    workingDocuments.updateDocumentContent(change.document.uri, change.document.getText());
  });

  connection.onCompletion((completionParams) => {
    logger.debug("Completion requested", {
      uri: completionParams.textDocument.uri,
      completionParams,
    });
    return workingDocuments.getCodeCompletionOptions(completionParams);
  });

  connection.onDefinition((params) => {
    return workingDocuments.getDefinitionLinks(params);
  });

  connection.onPrepareRename((params) => {
    return workingDocuments.getPrepareRenameCheck(params);
  });

  connection.onRenameRequest((params) => {
    return workingDocuments.getRenameEdit(params);
  });

  connection.languages.semanticTokens.on((params) => {
    logger.debug("Semantic tokens requested", { uri: params.textDocument.uri });
    return workingDocuments.getSemanticTokens(params.textDocument.uri);
  });

  documents.listen(connection);

  connection.listen();
}

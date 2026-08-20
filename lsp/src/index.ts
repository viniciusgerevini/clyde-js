import {
  createConnection,
  TextDocumentSyncKind,
  TextDocuments,
  type TextDocumentChangeEvent,
  type InitializeResult,
  type CompletionItem,
  // type InitializeParams,
  Diagnostic,
  DiagnosticSeverity,
  type CompletionParams,
  // CompletionItemKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { getLogger } from "./utils/logger.js";
import {
  buildSemanticResponseForDocument,
  semanticTokensLegend,
} from "./document/semantic_tokens.js";
import { WorkingDocumentsControl } from "./document/working_documents_control.js";
import { type ErrorInfo } from "./document/working_document.js";

// TODO get this from the right place to avoid duplication
const SERVER_VERSION = "0.0.1";

const connection = createConnection();

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const workingDocuments: WorkingDocumentsControl = new WorkingDocumentsControl(onParseFinished);

const logger = getLogger();

connection.onInitialize(() => {
  // connection.onInitialize((params: InitializeParams) => {
  logger.info("Server initializing");
  // const capabilities = params.capabilities;
  //

  // hasDiagnosticRelatedInformationCapability = !!(
  //   capabilities.textDocument &&
  //     capabilities.textDocument.publishDiagnostics &&
  //     capabilities.textDocument.publishDiagnostics.relatedInformation
  // );
  // hasConfigurationCapability = !!(
  //   capabilities.workspace && !!capabilities.workspace.configuration
  // );
  // hasWorkspaceFolderCapability = !!(
  //   capabilities.workspace && !!capabilities.workspace.workspaceFolders
  // );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        // triggerCharacters: [">"],
      },
      semanticTokensProvider: {
        legend: semanticTokensLegend,
        range: false,
        full: true,
      },

      // codeActionProvider?: boolean | CodeActionOptions;
      // hoverProvider?: boolean | HoverOptions;
      // renameProvider?: boolean | RenameOptions;
      // documentSymbolProvider: true,

      // signatureHelpProvider?: SignatureHelpOptions;
      // declarationProvider?: boolean | DeclarationOptions | DeclarationRegistrationOptions;
      //
      // definitionProvider?: boolean | DefinitionOptions;

      // referencesProvider?: boolean | ReferenceOptions;

      // documentHighlightProvider?: boolean | DocumentHighlightOptions;

      // codeLensProvider?: CodeLensOptions;

      // documentLinkProvider?: DocumentLinkOptions;

      // documentFormattingProvider?: boolean | DocumentFormattingOptions;

      // documentOnTypeFormattingProvider?: DocumentOnTypeFormattingOptions;

      // foldingRangeProvider?: boolean | FoldingRangeOptions
      // | FoldingRangeRegistrationOptions;

      // executeCommandProvider?: ExecuteCommandOptions;

      // semanticTokensProvider?: SemanticTokensOptions | SemanticTokensRegistrationOptions;

      // diagnosticProvider?: DiagnosticOptions | DiagnosticRegistrationOptions;

      // workspaceSymbolProvider?: boolean | WorkspaceSymbolOptions;

      /**
       * Workspace specific server capabilities
       */
      // workspace?: WorkspaceOptions;

      /**
       * Experimental server capabilities.
       */
      // experimental?: LSPAny;
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

connection.onCompletion((completionParams: CompletionParams): CompletionItem[] => {
  logger.debug("Completion requested", {
    uri: completionParams.textDocument.uri,
    completionParams,
  });

  // get completion context for position (line, column)
  //   - go through tokens till find the one closest to the column
  //   - do I need to operate on the contet? probably
  // positioon: line, character
  //
  // TODO detect what is being requested
  // - divert, blocks name
  // - speaker:
  return [];
  // return [
  //   {
  //     label: "TypeScript",
  //     kind: CompletionItemKind.Text,
  //     data: 1,
  //   },
  //   {
  //     label: "JavaScript",
  //     kind: CompletionItemKind.Text,
  //     data: 2,
  //   },
  // ];
  //
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
      source: "Clyde LSP",
    };

    diagnostics.push(diagnostic);
    logger.debug("Send diagnostics", { diagnostics });
    connection.sendDiagnostics({ uri, diagnostics });
  } else {
    logger.debug("Clear diagnostics");
    connection.sendDiagnostics({ uri, diagnostics: [] });
  }
}

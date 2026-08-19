import {
  createConnection,
  TextDocumentSyncKind,
  TextDocuments,
  type TextDocumentChangeEvent,
  type InitializeResult,
  type TextDocumentPositionParams,
  type CompletionItem,
  // CompletionItemKind,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { clearWorkingData, getSemanticTokens, validateDocument } from "./document_validator.js";
import { getLogger } from "./logger.js";
import { semanticTokensLegend } from "./document/semantic_tokens.js";

const connection = createConnection();

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const logger = getLogger();

connection.onInitialize(() => {
  logger.debug("Initialize server");
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

      // inlineCompletionProvider?: boolean | InlineCompletionOptions;

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
      version: "0.0.1", // TODO get version from package
    },
  };

  return result;
});

documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
  logger.debug("File closed", { uri: event.document.uri });
  clearWorkingData(event.document.uri);
});

documents.onDidChangeContent((change) => {
  logger.debug("File content changed", { uri: change.document.uri });
  validateDocument(change.document);
});

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  logger.debug("Completion requested", { uri: textDocumentPosition.textDocument.uri });
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
  return getSemanticTokens(params.textDocument.uri);
});

documents.listen(connection);

connection.listen();

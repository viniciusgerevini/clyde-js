import {
  createConnection,
  TextDocumentSyncKind,
  TextDocuments,
  type TextDocumentChangeEvent,
} from "vscode-languageserver/node";

import {
  type InitializeResult,
  type TextDocumentPositionParams,
  type CompletionItem,
  // CompletionItemKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { clearWorkingData, validateDocument } from "./document_validator.js";

const connection = createConnection();

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(() => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        // triggerCharacters: [">"],
      },

      // hoverProvider?: boolean | HoverOptions;
      // signatureHelpProvider?: SignatureHelpOptions;
      // declarationProvider?: boolean | DeclarationOptions | DeclarationRegistrationOptions;
      //
      // definitionProvider?: boolean | DefinitionOptions;

      // referencesProvider?: boolean | ReferenceOptions;

      // documentHighlightProvider?: boolean | DocumentHighlightOptions;
      // documentSymbolProvider?: boolean | DocumentSymbolOptions;

      // codeActionProvider?: boolean | CodeActionOptions;

      // codeLensProvider?: CodeLensOptions;

      // documentLinkProvider?: DocumentLinkOptions;

      // documentFormattingProvider?: boolean | DocumentFormattingOptions;

      // documentOnTypeFormattingProvider?: DocumentOnTypeFormattingOptions;

      // renameProvider?: boolean | RenameOptions;

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
  clearWorkingData(event.document.uri);
});

documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
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
});

documents.listen(connection);

connection.listen();

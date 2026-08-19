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

import { getLogger } from "./logger.js";
import {
  buildSemanticResponseForDocument,
  semanticTokensLegend,
} from "./document/semantic_tokens.js";
import { WorkingDocumentsControl } from "./document/working_documents_control.js";

const connection = createConnection();

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const workingDocuments: WorkingDocumentsControl = new WorkingDocumentsControl();

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
  logger.info("File closed", { uri: event.document.uri });
  workingDocuments.removeWorkingDocument(event.document.uri);
});

documents.onDidChangeContent((change) => {
  logger.info("File content changed", { uri: change.document.uri });
  const workingDocument = workingDocuments.getOrInitWorkingDocument(change.document.uri);
  workingDocument.updateContent(change.document.getText());

  // TODO parse should happen inside update content
  // TODO hasDiagnostics()
  // TODO send diagnostics back

  // const text = textDocument.getText();
  // try {
  //   const parseDoc = parse(text);
  // } catch (e) {}
  // TODO run lexer
  // TODO run parser
  // TODO store latest successfull parse result
  //   let diagnostics: Diagnostic[] = [];
  //     let diagnostic: Diagnostic = {
  //       severity: DiagnosticSeverity.Warning,
  //       range: {
  //         start: textDocument.positionAt(m.index),
  //         end: textDocument.positionAt(m.index + m[0].length),
  //       },
  //       message: `${m[0]} is all uppercase.`,
  //       source: "ex",
  //     };
  //     if (hasDiagnosticRelatedInformationCapability) {
  //       diagnostic.relatedInformation = [
  //         {
  //           location: {
  //             uri: textDocument.uri,
  //             range: Object.assign({}, diagnostic.range),
  //           },
  //           message: "Spelling matters",
  //         },
  //         {
  //           location: {
  //             uri: textDocument.uri,
  //             range: Object.assign({}, diagnostic.range),
  //           },
  //           message: "Particularly for names",
  //         },
  //       ];
  //     }
  //     diagnostics.push(diagnostic);
  //
  //   connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
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
  const workingDocument = workingDocuments.getOrInitWorkingDocument(params.textDocument.uri);
  return buildSemanticResponseForDocument(workingDocument);
});

documents.listen(connection);

connection.listen();

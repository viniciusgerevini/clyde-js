// import {SemanticTokens, SemanticTokensBuilder} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { WorkingDocument } from "./document/working_document.js";
// import { getLogger } from "./logger.js";
import { buildSemanticResponseForDocument } from "./document/semantic_tokens.js";
import type { SemanticTokens } from "vscode-languageserver";

// const logger = getLogger();
const workingDocuments: Map<string, WorkingDocument> =  new Map();

export function notifyContentChange(textDocument: TextDocument): void {
  textDocument.uri;

}

export function validateDocument(textDocument: TextDocument): void {
  const workingDocument = getWorkingDocument(textDocument.uri);

  workingDocument.updateContent(textDocument.getText());

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
}

export function getSemanticTokens(uri: string): SemanticTokens {
  const workingDocument = getWorkingDocument(uri);
  return buildSemanticResponseForDocument(workingDocument);
}

export function clearWorkingData(_uri: string): void {
  // TODO clear working data
}


function getWorkingDocument(uri: string): WorkingDocument {
  if (!workingDocuments.has(uri)) {
    workingDocuments.set(uri, new WorkingDocument(uri));
  }

  return workingDocuments.get(uri)!;
}

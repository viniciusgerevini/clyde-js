import { TextDocument } from "vscode-languageserver-textdocument";
// import { parse } from "@clyde-lang/parser";

export function validateDocument(_textDocument: TextDocument): void {
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

export function clearWorkingData(_uri: string): void {
  // TODO clear working data
}

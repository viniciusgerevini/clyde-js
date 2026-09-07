import {
  type CompletionItem,
  type CompletionParams,
  type DefinitionParams,
  type DefinitionLink,
  type RenameParams,
  WorkspaceEdit,
  type PrepareRenameParams,
  Range,
} from "vscode-languageserver/node";
import { buildSemanticResponseForDocument } from "../features/semantic_tokens.js";
import { getCompletionOptions } from "../features/completion.js";
import { onDefinitionRequest } from "../features/definitions.js";
import { WorkingDocument, type ErrorInfo } from "./working_document.js";
import { onPrepareRenameRequest, onRenameRequest } from "../features/renames.js";

type ParseCallback = (uri: string, error: ErrorInfo | undefined) => void;

export class WorkingDocumentsControl {
  private workingDocuments: Map<string, WorkingDocument> = new Map();
  constructor(private onParseCallback: ParseCallback) {}

  updateDocumentContent(uri: string, content: string): void {
    const workingDocument = this.getOrInitWorkingDocument(uri);
    workingDocument.updateContent(content);
  }

  getCodeCompletionOptions(completionParams: CompletionParams): CompletionItem[] {
    return getCompletionOptions(
      completionParams,
      this.getDocument(completionParams.textDocument.uri),
    );
  }

  getDefinitionLinks(params: DefinitionParams): DefinitionLink[] | undefined {
    return onDefinitionRequest(params, this.getDocument(params.textDocument.uri));
  }

  getSemanticTokens(uri: string) {
    return buildSemanticResponseForDocument(this.getDocument(uri));
  }

  getDocument(uri: string): WorkingDocument {
    return this.getOrInitWorkingDocument(uri);
  }

  getRenameEdit(params: RenameParams): WorkspaceEdit | undefined {
    return onRenameRequest(params, this.getDocument(params.textDocument.uri));
  }

  getPrepareRenameCheck(params: PrepareRenameParams): Range | undefined {
    return onPrepareRenameRequest(params, this.getDocument(params.textDocument.uri));
  }

  removeDocument(uri: string) {
    this.workingDocuments.delete(uri);
  }

  getDocumentCount(): number {
    return this.workingDocuments.size;
  }

  getOrInitWorkingDocument(uri: string): WorkingDocument {
    if (!this.workingDocuments.has(uri)) {
      const workingDoc = new WorkingDocument(uri);
      workingDoc.addParseFinishedListener((error) => {
        this.onParseCallback(uri, error);
      });
      this.workingDocuments.set(uri, workingDoc);
    }
    return this.workingDocuments.get(uri)!;
  }
}

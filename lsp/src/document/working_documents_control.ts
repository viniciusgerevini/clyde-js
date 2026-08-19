import { WorkingDocument, type ErrorInfo } from "./working_document.js";

type ParseFinishedCallback = (uri: string, error: ErrorInfo | undefined) => void;

export class WorkingDocumentsControl {
  private workingDocuments: Map<string, WorkingDocument> = new Map();

  constructor(private parseFinishedCallback: ParseFinishedCallback) {}

  getOrInitWorkingDocument(uri: string): WorkingDocument {
    if (!this.workingDocuments.has(uri)) {
      const workingDoc = new WorkingDocument(uri);
      workingDoc.addParseFinishedListener((error) => {
        this.parseFinishedCallback(uri, error);
      });
      this.workingDocuments.set(uri, workingDoc);
    }
    return this.workingDocuments.get(uri)!;
  }

  removeWorkingDocument(uri: string): void {
    this.workingDocuments.delete(uri);
  }
}

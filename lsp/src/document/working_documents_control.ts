import { WorkingDocument } from "./working_document.js";

export class WorkingDocumentsControl {
  constructor(private workingDocuments: Map<string, WorkingDocument> = new Map()) {}

  getOrInitWorkingDocument(uri: string): WorkingDocument {
    if (!this.workingDocuments.has(uri)) {
      this.workingDocuments.set(uri, new WorkingDocument(uri));
    }
    return this.workingDocuments.get(uri)!;
  }

  removeWorkingDocument(uri: string): void {
    this.workingDocuments.delete(uri);
  }
}

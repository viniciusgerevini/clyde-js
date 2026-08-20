import { describe, it, vi, beforeEach, Mock, expect, afterEach } from 'vitest'
import { WorkingDocumentsControl } from './working_documents_control';

describe("Working Documents Control", () => {
  let parseFinishedCallbackStub: Mock;
  let workingDocumentsControl: WorkingDocumentsControl;

  beforeEach(() => {
    parseFinishedCallbackStub = vi.fn();
    workingDocumentsControl = new WorkingDocumentsControl(parseFinishedCallbackStub);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes a new working document", () => {
    // just an initial check to ensure count is initialized correctly
    expect(workingDocumentsControl.getWorkingDocumentsCount()).toBe(0);

    const fakeDocUri = "fake_uri";
    const doc = workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri);

    expect(doc.getDocumentUri()).toBe(fakeDocUri);
    expect(workingDocumentsControl.getWorkingDocumentsCount()).toBe(1);
  });

  it("gets existing working document when already created", () => {
    const fakeDocUri = "fake_uri";
    const fakeDocUri2 = "fake_uri_2";
    const doc1 = workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri);
    const doc2 = workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri2);
    const doc1Again = workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri);

    expect(doc1.getDocumentUri()).toBe(fakeDocUri);
    expect(doc2.getDocumentUri()).toBe(fakeDocUri2);
    expect(doc1Again.getDocumentUri()).toBe(fakeDocUri);
    expect(doc1).toBe(doc1Again);
    expect(workingDocumentsControl.getWorkingDocumentsCount()).toBe(2);
  });

  it("call parse finished callback when document parsing is finished", () => {
    vi.useFakeTimers();
    const fakeDocUri = "fake_uri";
    const doc = workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri);
    doc.parse();
    // give time for debounce to kick in
    vi.advanceTimersByTime(1000);

    expect(parseFinishedCallbackStub).toHaveBeenCalledWith(fakeDocUri, undefined);
  });

  it("remove working document", () => {
    const fakeDocUri = "fake_uri";
    const fakeDocUri2 = "fake_uri_2";
    workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri);
    workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri2);

    workingDocumentsControl.removeWorkingDocument(fakeDocUri);

    expect(workingDocumentsControl.getWorkingDocumentsCount()).toBe(1);

    // try to fetch existing to make sure the right one was deleted
    workingDocumentsControl.getOrInitWorkingDocument(fakeDocUri2);
    expect(workingDocumentsControl.getWorkingDocumentsCount()).toBe(1);
  });
});

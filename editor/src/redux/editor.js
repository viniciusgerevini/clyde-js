import { createAction, createReducer } from "@reduxjs/toolkit";

export const setDocumentContent = createAction('editor/interpreter/set_document_content');

export function createEmptyState() {
  return {
    currentValue: ''
  };
}

const setDocumentContentReducer = (state, action) => {
  state.currentValue = action.payload;
  return state;
};


const editorReducers = createReducer(createEmptyState(), {
  [setDocumentContent]: setDocumentContentReducer
});

export default editorReducers;

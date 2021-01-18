import { createAction, createReducer } from "@reduxjs/toolkit";

export const setDocumentContent = createAction('editor/editor/set_document_content');
export const updatePreference = createAction('editor/editor/update_preference');

export function createEmptyState() {
  return {
    currentValue: '',
    preferences: {
      theme: 'dracula',
      fontSize: 16,
      tabSize: 4,
      highlightActiveLine: false,
      lineWrap: false,
      useSoftTabs: true,
      showInvisibles: false,
      scrollPastEnd: false
    }
  };
}

const setDocumentContentReducer = (state, action) => {
  state.currentValue = action.payload;
  return state;
};

const updatePreferenceReducer = (state, action) => {
  state.preferences[action.payload.name] = action.payload.value;
  return state;
};

const editorReducers = createReducer(createEmptyState(), {
  [setDocumentContent]: setDocumentContentReducer,
  [updatePreference]: updatePreferenceReducer,
});

export default editorReducers;

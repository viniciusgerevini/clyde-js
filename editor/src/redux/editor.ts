import { AnyAction } from "redux";
import { createAction, createReducer } from "@reduxjs/toolkit";

export const setDocumentContent = createAction<string>('editor/editor/set_document_content');
export const updatePreference = createAction<{name: string, value: any}>('editor/editor/update_preference');

export interface EditorState {
  currentValue: string;
  preferences: {
    theme: string;
    fontSize: number;
    tabSize: number;
    highlightActiveLine: boolean;
    lineWrap: boolean;
    useSoftTabs: boolean;
    showInvisibles: boolean;
    scrollPastEnd: boolean;
    vimMode: boolean;
  }
};

export function createEmptyState(): EditorState {
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
      scrollPastEnd: false,
      vimMode: false,
    }
  };
}

const setDocumentContentReducer = (state: EditorState, action: AnyAction) => {
  state.currentValue = action.payload;
  return state;
};

const updatePreferenceReducer = (state: EditorState, action: AnyAction) => {
  (state.preferences as any)[action.payload.name] = action.payload.value;
  return state;
};

const editorReducers = createReducer(createEmptyState(), (builder) => (
  builder
    .addCase(setDocumentContent, setDocumentContentReducer)
    .addCase(updatePreference, updatePreferenceReducer)
));

export default editorReducers;

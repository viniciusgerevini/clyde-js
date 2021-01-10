import { createAction, createReducer } from "@reduxjs/toolkit";

export function createEmptyState() {
  return {
    currentValue: ''
  };
}



const editorReducers = createReducer(createEmptyState(), {
});

export default editorReducers;

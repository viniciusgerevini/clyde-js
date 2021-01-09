import { createAction, createReducer } from "@reduxjs/toolkit";

export const toggleEditor = createAction('editor/interface/toggle_editor');
export const toggleInterpreter = createAction('editor/interface/toggle_intepreter');
export const changeInterpreterSplitDirection = createAction('editor/interface/change_interpreter_split_direction');

export function createEmptyState() {
  return {
    isEditorEnabled: true,
    isInterpreterEnabled: true,
    isProjectTreeEnabled: true,
    interpreterSplitDirection: 'vertical'
  };
}


const toggleEditorReducer = (state, action) => {
  state.isEditorEnabled = action.payload.state;
  return state;
};

const toggleInterpreterReducer = (state, action) => {
  state.isInterpreterEnabled = action.payload.state;
  return state;
};

const changeInterpreterSplitDirectionReducer = (state, action) => {
  state.interpreterSplitDirection = action.payload.direction;
  return state;
};

const interfaceReducers = createReducer(createEmptyState(), {
  [toggleEditor]: toggleEditorReducer,
  [toggleInterpreter]: toggleInterpreterReducer,
  [changeInterpreterSplitDirection]: changeInterpreterSplitDirectionReducer,
});

export default interfaceReducers;

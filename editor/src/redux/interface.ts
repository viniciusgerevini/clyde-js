import { AnyAction } from "redux";
import { createAction, createReducer } from "@reduxjs/toolkit";

export const toggleEditor = createAction<{state: any}>('editor/interface/toggle_editor');
export const toggleInterpreter = createAction<{state: any}>('editor/interface/toggle_intepreter');
export const changeInterpreterSplitDirection = createAction<{direction: string}>('editor/interface/change_interpreter_split_direction');

export interface InterfaceState {
  isEditorEnabled: boolean;
  isInterpreterEnabled: boolean;
  interpreterSplitDirection: 'vertical' | 'horizontal';
};

export function createEmptyState(): InterfaceState {
  return {
    isEditorEnabled: true,
    isInterpreterEnabled: true,
    interpreterSplitDirection: 'vertical'
  };
}

const toggleEditorReducer = (state: InterfaceState, action: AnyAction) => {
  state.isEditorEnabled = action.payload.state;
  return state;
};

const toggleInterpreterReducer = (state: InterfaceState, action: AnyAction) => {
  state.isInterpreterEnabled = action.payload.state;
  return state;
};

const changeInterpreterSplitDirectionReducer = (state: InterfaceState, action: AnyAction) => {
  state.interpreterSplitDirection = action.payload.direction;
  return state;
};

const interfaceReducers = createReducer(createEmptyState(), (builder) => (
  builder
    .addCase(toggleEditor, toggleEditorReducer)
    .addCase(toggleInterpreter, toggleInterpreterReducer)
    .addCase(changeInterpreterSplitDirection, changeInterpreterSplitDirectionReducer)
));

export default interfaceReducers;

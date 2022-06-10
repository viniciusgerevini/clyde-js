import { AnyAction } from "redux";
import { createAction, createReducer } from "@reduxjs/toolkit";

export const setBlock = createAction<string>('editor/interpreter/set_dialogue_block');
export const addDialogueLine = createAction<any>('editor/interpreter/add_dialogue_line');
export const clearTimeline = createAction('editor/interpreter/clear_timeline');
export const showExtraMetadata = createAction('editor/interpreter/show_metadata');
export const hideExtraMetadata = createAction('editor/interpreter/hide_metadata');
export const showDebugPane = createAction('editor/interpreter/show_debug_pane');
export const hideDebugPane = createAction('editor/interpreter/hide_debug_pane');
export const enableSingleBubbleDialogue = createAction('editor/interpreter/enable_single_bubble_dialogue');
export const disableSingleBubbleDialogue = createAction('editor/interpreter/disable_single_bubble_dialogue');
export const chooseOption = createAction<number>('editor/interpreter/choose_option');
export const notifyEvent = createAction<any>('editor/interpreter/notify_event');
export const clearEvents = createAction('editor/interpreter/clear_events');

export interface InterpreterState {
  currentBlock: any,
  timeline: any[],
  shouldShowExtraMetadata: boolean,
  shouldShowDebugPane: boolean,
  singleBubblePresentation: boolean,
  document: any,
  events: any[],
  debugPaneDirection: 'horizontal'
}

export function createEmptyState(): InterpreterState {
  return {
    currentBlock: undefined,
    timeline: [],
    shouldShowExtraMetadata: false,
    shouldShowDebugPane: false,
    singleBubblePresentation: false,
    document: undefined,
    events: [],
    debugPaneDirection: 'horizontal'
  };
}

const setBlockReducer = (state: InterpreterState, action: AnyAction) => {
  state.currentBlock = action.payload;
  return state;
};

const addDialogueLineReducer = (state: InterpreterState, action: AnyAction) => {
  state.timeline = [...state.timeline, action.payload];
  return state;
};

const clearTimelineReducer = (state: InterpreterState, _action: AnyAction) => {
  state.timeline = [];
  return state;
};

const showExtraMetadataReducer = (state: InterpreterState) => {
  state.shouldShowExtraMetadata = true;
  return state;
};

const hideExtraMetadataReducer = (state: InterpreterState) => {
  state.shouldShowExtraMetadata = false;
  return state;
};

const showDebugPaneReducer = (state: InterpreterState) => {
  state.shouldShowDebugPane = true;
  return state;
};

const hideDebugPaneReducer = (state: InterpreterState) => {
  state.shouldShowDebugPane = false;
  return state;
};

const enableSingleBubbleDialogueReducer = (state: InterpreterState) => {
  state.singleBubblePresentation = true;
  return state;
};

const disableSingleBubbleDialogReducer = (state: InterpreterState) => {
  state.singleBubblePresentation = false;
  return state;
};

const chooseOptionReducer = (state: InterpreterState, action: AnyAction) => {
  if (!state.timeline.length || state.timeline[state.timeline.length -1].type !== 'options') {
    return state;
  }
  state.timeline[state.timeline.length -1].selected = action.payload;
  return state;
};

const notifyEventReducer = (state: InterpreterState, action: AnyAction) => {
  state.events = [...state.events, action.payload];
  return state;
};

const clearEventsReducer = (state: InterpreterState, _action: AnyAction) => {
  state.events = [];
  return state;
};

const interpreterReducers = createReducer(createEmptyState(), (builder) => (
  builder
  .addCase(setBlock, setBlockReducer)
  .addCase(addDialogueLine, addDialogueLineReducer)
  .addCase(clearTimeline, clearTimelineReducer)
  .addCase(showExtraMetadata, showExtraMetadataReducer)
  .addCase(hideExtraMetadata, hideExtraMetadataReducer)
  .addCase(showDebugPane, showDebugPaneReducer)
  .addCase(hideDebugPane, hideDebugPaneReducer)
  .addCase(enableSingleBubbleDialogue, enableSingleBubbleDialogueReducer)
  .addCase(disableSingleBubbleDialogue, disableSingleBubbleDialogReducer)
  .addCase(chooseOption, chooseOptionReducer)
  .addCase(notifyEvent, notifyEventReducer)
  .addCase(clearEvents, clearEventsReducer)
));

export default interpreterReducers;

import { createAction, createReducer } from "@reduxjs/toolkit";

export const setBlock = createAction('editor/interpreter/set_dialogue_block');
export const addDialogueLine = createAction('editor/interpreter/add_dialogue_line');
export const clearTimeline = createAction('editor/interpreter/clear_timeline');
export const showExtraMetadata = createAction('editor/interpreter/show_metadata');
export const hideExtraMetadata = createAction('editor/interpreter/hide_metadata');
export const showDebugPane = createAction('editor/interpreter/show_debug_pane');
export const hideDebugPane = createAction('editor/interpreter/hide_debug_pane');
export const setDebugPaneDirection = createAction('editor/interpreter/set_debug_pane_direction');
export const enableSingleBubbleDialogue = createAction('editor/interpreter/enable_single_bubble_dialogue');
export const disableSingleBubbleDialogue = createAction('editor/interpreter/disable_single_bubble_dialogue');
export const chooseOption = createAction('editor/interpreter/choose_option');
export const notifyEvent = createAction('editor/interpreter/notify_event');
export const clearEvents = createAction('editor/interpreter/clear_events');


export function createEmptyState() {
  return {
    currentBlock: undefined,
    timeline: [],
    shouldShowExtraMetadata: false,
    shouldShowDebugPane: false,
    debugPaneDirection: 'horizontal',
    singleBubblePresentation: false,
    document: undefined,
    events: []
  };
}

const setBlockReducer = (state, action) => {
  state.currentBlock = action.payload;
  return state;
};

const addDialogueLineReducer = (state, action) => {
  state.timeline = [...state.timeline, action.payload];
  return state;
};

const clearTimelineReducer = (state, _action) => {
  state.timeline = [];
  return state;
};

const showExtraMetadataReducer = (state) => {
  state.shouldShowExtraMetadata = true;
  return state;
};

const hideExtraMetadataReducer = (state) => {
  state.shouldShowExtraMetadata = false;
  return state;
};

const showDebugPaneReducer = (state) => {
  state.shouldShowDebugPane = true;
  return state;
};

const hideDebugPaneReducer = (state) => {
  state.shouldShowDebugPane = false;
  return state;
};

const setDebugPaneDirectionReducer = (state, action) => {
  state.debugPaneDirection = action.payload.direction;
  return state;
};

const enableSingleBubbleDialogueReducer = (state) => {
  state.singleBubblePresentation = true;
  return state;
};

const disableSingleBubbleDialogReducer = (state) => {
  state.singleBubblePresentation = false;
  return state;
};

const chooseOptionReducer = (state, action) => {
  if (!state.timeline.length || state.timeline[state.timeline.length -1].type !== 'options') {
    return state;
  }
  state.timeline[state.timeline.length -1].selected = action.payload;
  return state;
};

const notifyEventReducer = (state, action) => {
  state.events = [...state.events, action.payload];
  return state;
};

const clearEventsReducer = (state, _action) => {
  state.events = [];
  return state;
};

const interpreterReducers = createReducer(createEmptyState(), {
  [setBlock]: setBlockReducer,
  [addDialogueLine]: addDialogueLineReducer,
  [clearTimeline]: clearTimelineReducer,
  [showExtraMetadata]: showExtraMetadataReducer,
  [hideExtraMetadata]: hideExtraMetadataReducer,
  [showDebugPane]: showDebugPaneReducer,
  [hideDebugPane]: hideDebugPaneReducer,
  [setDebugPaneDirection]: setDebugPaneDirectionReducer,
  [enableSingleBubbleDialogue]: enableSingleBubbleDialogueReducer,
  [disableSingleBubbleDialogue]: disableSingleBubbleDialogReducer,
  [chooseOption]: chooseOptionReducer,
  [notifyEvent]: notifyEventReducer,
  [clearEvents]: clearEventsReducer,
});

export default interpreterReducers;

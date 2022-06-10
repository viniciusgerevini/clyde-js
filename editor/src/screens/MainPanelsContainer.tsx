import { connect } from 'react-redux';

import MainPanels from './MainPanels';

import {
  toggleEditor,
  toggleInterpreter,
  changeInterpreterSplitDirection
} from '../redux/interface';

import {
  setBlock,
  addDialogueLine,
  clearTimeline,
  showExtraMetadata,
  hideExtraMetadata,
  showDebugPane,
  hideDebugPane,
  enableSingleBubbleDialogue,
  disableSingleBubbleDialogue,
  chooseOption,
  notifyEvent,
  clearEvents,
} from '../redux/interpreter';

import {
  setDocumentContent,
  updatePreference
} from '../redux/editor';

import { RootState, AppDispatch } from '../redux/store';

const mapStateToProps = (state: RootState, props: any) => ({
  ...state.interfaceConfig,
  editorDefaultValue: state.editor.currentValue,
  editorPreferences: state.editor.preferences,
  ...state.interpreter,
  ...props
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  toggleEditor: (state: RootState) => {
    dispatch(toggleEditor({state}));
  },
  toggleInterpreter: (state: RootState) => {
    dispatch(toggleInterpreter({state}));
  },
  changeInterpreterSplitDirection: (direction: string) => {
    dispatch(changeInterpreterSplitDirection({direction}));
  },
  setBlock: (blockName: string) => {
    dispatch(setBlock(blockName));
  },
  addDialogueLine: (line: any) => {
    dispatch(addDialogueLine(line));
  },
  clearTimeline: () => {
    dispatch(clearTimeline());
  },
  showExtraMetadata: () => {
    dispatch(showExtraMetadata());
  },
  hideExtraMetadata: () => {
    dispatch(hideExtraMetadata());
  },
  showDebugPane: () => {
    dispatch(showDebugPane());
  },
  hideDebugPane: () => {
    dispatch(hideDebugPane());
  },
  enableSingleBubbleDialogue: () => {
    dispatch(enableSingleBubbleDialogue());
  },
  disableSingleBubbleDialogue: () => {
    dispatch(disableSingleBubbleDialogue());
  },
  chooseOption: (optionIndex: number) => {
    dispatch(chooseOption(optionIndex));
  },
  setDocumentContent: (content: string) => {
    dispatch(setDocumentContent(content));
  },
  notifyEvent: (event: any) => {
    dispatch(notifyEvent(event));
  },
  clearEvents: () => {
    dispatch(clearEvents());
  },
  updateEditorPreference: (name: string, value: any) => {
    dispatch(updatePreference({ name, value }));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MainPanels);


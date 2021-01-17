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
  setDebugPaneDirection,
  enableSingleBubbleDialogue,
  disableSingleBubbleDialogue,
  chooseOption,
  notifyEvent,
  clearEvents,
} from '../redux/interpreter';

import {
  setDocumentContent
} from '../redux/editor';

const mapStateToProps = (state, props) => ({
  ...state.interfaceConfig,
  editorDefaultValue: state.editor.currentValue,
  ...state.interpreter,
  ...props
});

const mapDispatchToProps = dispatch => ({
  toggleEditor: (state) => {
    dispatch(toggleEditor({state}));
  },
  toggleInterpreter: (state) => {
    dispatch(toggleInterpreter({state}));
  },
  changeInterpreterSplitDirection: (direction) => {
    dispatch(changeInterpreterSplitDirection({direction}));
  },
  setBlock: (blockName) => {
    dispatch(setBlock(blockName));
  },
  addDialogueLine: (line) => {
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
  setDebugPaneDirection: (direction) => {
    dispatch(setDebugPaneDirection({direction}));
  },
  enableSingleBubbleDialogue: () => {
    dispatch(enableSingleBubbleDialogue());
  },
  disableSingleBubbleDialogue: () => {
    dispatch(disableSingleBubbleDialogue());
  },
  chooseOption: (optionIndex) => {
    dispatch(chooseOption(optionIndex));
  },
  setDocumentContent: (content) => {
    dispatch(setDocumentContent(content));
  },
  notifyEvent: (event) => {
    dispatch(notifyEvent(event));
  },
  clearEvents: () => {
    dispatch(clearEvents());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MainPanels);


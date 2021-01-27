import React, { useState } from "react";
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Interpreter as ClydeInterpreter } from 'clyde-interpreter';
import { parse } from 'clyde-parser';

import { InfoBubble, ErrorBubble } from './Bubbles';
import InterpreterToolbar from './InterpreterToolbar';
import InterpreterTimeline from './InterpreterTimeline';
import DebugPane from './DebugPane';

import SplitPane from '../screens/SplitPane';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export default function Interpreter(p) {
  const {
    content,
    currentBlock,
    timeline,
    shouldShowExtraMetadata,
    shouldShowDebugPane,
    debugPaneDirection,
    singleBubblePresentation,
    clydeDocument,
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
    events,
    ...props } = p;
  const [lastContent, setLastContent] = useState('');
  const [persistedDialogue, setDialogue] = useState();
  let dialogue = persistedDialogue;
  // const dictionary = argv.translation ? await getTranslationDictionary(argv.translation) : undefined;
  // const data = argv['save-data'] ? loadSaveFile(argv['save-data']) : undefined;
  // dialogue.on(dialogue.events.VARIABLE_CHANGED, trackInternalChanges('variable', events));
  // dialogue.on(dialogue.events.EVENT_TRIGGERED, trackInternalChanges('event', events));
  let doc;
  let errorMessage;

  const updateEventInfo = (data) => {
    updateDebugInfo('event', data);
  };

  const updateVariableInfo = (data) => {
    updateDebugInfo('variable', data);
  };

  const updateDebugInfo = (type, data) => {
    notifyEvent({ type, data, eventTime: Date.now() });
  };

  try {
    doc = parse(`${content || ''}`);

    if (!dialogue || content !== lastContent) {
      setLastContent(content);
      dialogue = ClydeInterpreter(doc);
      if (currentBlock) {
        dialogue.begin(currentBlock);
        setBlock(currentBlock);
      }
      setDialogue(dialogue);

      dialogue.on(dialogue.events.VARIABLE_CHANGED, updateVariableInfo);
      dialogue.on(dialogue.events.EVENT_TRIGGERED, updateEventInfo);
    }
  } catch (e) {
    errorMessage = e.message;
    doc = parse(`${lastContent || ''}`);
  }

  return (
    <Wrapper {...props} aria-label="Clyde interpreter">
      <InterpreterToolbar
        doc={doc}
        currentBlock={currentBlock}
        timeline={timeline}
        shouldShowExtraMetadata={shouldShowExtraMetadata}
        shouldShowDebugPane={shouldShowDebugPane}
        debugPaneDirection={debugPaneDirection}
        singleBubblePresentation={singleBubblePresentation}
        setBlock={setBlock}
        clearTimeline={clearTimeline}
        showExtraMetadata={showExtraMetadata}
        hideExtraMetadata={hideExtraMetadata}
        showDebugPane={showDebugPane}
        hideDebugPane={hideDebugPane}
        setDebugPaneDirection={setDebugPaneDirection}
        enableSingleBubbleDialogue={enableSingleBubbleDialogue}
        disableSingleBubbleDialogue={disableSingleBubbleDialogue}
        addDialogueLine={addDialogueLine}
        dialogue={dialogue}
        chooseOption={chooseOption}
        clearEvents={clearEvents}
      />

      <SplitPane
        direction={debugPaneDirection}
        defaultSizes={[80, 20]}
        style={{height: 'calc(100% - 40px)'}}
       >
        { !errorMessage && content && content !== '' ?
          <InterpreterTimeline
            dialogue={dialogue}
            currentBlock={currentBlock}
            timeline={timeline}
            shouldShowExtraMetadata={shouldShowExtraMetadata}
            singleBubblePresentation={singleBubblePresentation}
            setBlock={setBlock}
            addDialogueLine={addDialogueLine}
            clearTimeline={clearTimeline}
            chooseOption={chooseOption}
            />
            : (errorMessage ? <ErrorBubble style={{ backgroundColor: '#eeefef' }}>{errorMessage}</ErrorBubble> :  <InfoBubble>Nothing to show.</InfoBubble>)}

        { shouldShowDebugPane ?
            <DebugPane events={events} hideDebugPane={hideDebugPane}/>
        : undefined }
      </SplitPane>
    </Wrapper>
  );
}

Interpreter.propTypes = {
  currentBlock: PropTypes.string,
  timeline: PropTypes.array,
  shouldShowExtraMetadata: PropTypes.bool,
  shouldShowDebugPane: PropTypes.bool,
  debugPaneDirection: PropTypes.string,
  singleBubblePresentation: PropTypes.bool,
  clydeDocument: PropTypes.string,
  setBlock: PropTypes.func,
  addDialogueLine: PropTypes.func,
  clearTimeline: PropTypes.func,
  showExtraMetadata: PropTypes.func,
  hideExtraMetadata: PropTypes.func,
  showDebugPane: PropTypes.func,
  hideDebugPane: PropTypes.func,
  setDebugPaneDirection: PropTypes.func,
  enableSingleBubbleDialogue: PropTypes.func,
  disableSingleBubbleDialogue: PropTypes.func,
};

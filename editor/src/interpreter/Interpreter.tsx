import { useState } from "react";
import styled from 'styled-components';

import { Interpreter as ClydeInterpreter, EventType } from '@clyde-lang/interpreter';
import { parse } from '@clyde-lang/parser';

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


interface InterpreterProps {
  content: any;
  currentBlock: string,
  timeline: any[],
  shouldShowExtraMetadata: boolean;
  shouldShowDebugPane: boolean;
  singleBubblePresentation: boolean;
  clydeDocument: string;
  setBlock: Function;
  addDialogueLine: Function;
  clearTimeline: Function;
  showExtraMetadata: Function;
  hideExtraMetadata: Function;
  showDebugPane: Function;
  hideDebugPane: Function;
  enableSingleBubbleDialogue: Function;
  disableSingleBubbleDialogue: Function;
  debugPaneDirection?: "horizontal" | "vertical";
  chooseOption: Function;
  notifyEvent: Function;
  clearEvents: Function;
  events: any;
};

export default function Interpreter(p: InterpreterProps) {
  const {
    content,
    currentBlock,
    timeline,
    shouldShowExtraMetadata,
    shouldShowDebugPane,
    debugPaneDirection = "horizontal",
    singleBubblePresentation,
    clydeDocument,
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
    events,
    ...props } = p;
  const [lastContent, setLastContent] = useState('');
  const [persistedDialogue, setDialogue] = useState();
  let dialogue: any = persistedDialogue;
  let doc;
  let errorMessage;

  const updateEventInfo = (data: React.ChangeEvent<HTMLInputElement>) => {
    updateDebugInfo('event', data);
  };

  const updateVariableInfo = (data: React.ChangeEvent<HTMLInputElement>) => {
    updateDebugInfo('variable', data);
  };

  const updateDebugInfo = (type: string, data: any) => {
    notifyEvent({ type, data, eventTime: Date.now() });
  };

  try {
    doc = parse(`${content || ''}`);

    if (!dialogue || content !== lastContent) {
      setLastContent(content);
      dialogue = ClydeInterpreter(doc);
      if (currentBlock) {
        dialogue.start(currentBlock);
        setBlock(currentBlock);
      }
      setDialogue(dialogue);

      dialogue.on(EventType.VARIABLE_CHANGED, updateVariableInfo);
      dialogue.on(EventType.EVENT_TRIGGERED, updateEventInfo);
    }
  } catch (e: any) {
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
        singleBubblePresentation={singleBubblePresentation}
        setBlock={setBlock}
        clearTimeline={clearTimeline}
        showExtraMetadata={showExtraMetadata}
        hideExtraMetadata={hideExtraMetadata}
        showDebugPane={showDebugPane}
        hideDebugPane={hideDebugPane}
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

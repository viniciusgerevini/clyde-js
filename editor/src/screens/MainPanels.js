import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faColumns, faCode, faEye } from '@fortawesome/free-solid-svg-icons'

import SplitPane from './SplitPane';
import DropDownMenu, { DropDownItem } from './DropdownMenu';

import Editor from '../editor/Editor';
import Interpreter from '../interpreter/Interpreter';

const Wrapper = styled.div`
  height: 100%;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  height: 40px;
  font-size: 1.5em;
  color: #444;
  padding-left: 10px;
  align-items: center;
`;

const IconWrapper = styled.span`
  cursor: pointer;
  position: relative;
`;

export default function MainPanels(props) {
  const {
    // interface
    isEditorEnabled = true,
    isInterpreterEnabled = true,
    toggleEditor,
    toggleInterpreter,
    interpreterSplitDirection = 'vertical',
    changeInterpreterSplitDirection,
    // editor
    editorDefaultValue,
    setDocumentContent,
    // interpreter
    currentBlock,
    timeline,
    shouldShowExtraMetadata,
    shouldShowDebugPane,
    debugPaneDirection,
    singleBubblePresentation,
    document: clydeDocument,
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
    events,
    notifyEvent,
    clearEvents,
  } = props;

  const [isMenuVisible, setMenuVisibility] = useState(false);

  const toggleSplitDirection = () => {
    if (interpreterSplitDirection === 'vertical') {
      changeInterpreterSplitDirection('horizontal');
    } else {
      changeInterpreterSplitDirection('vertical');
    }
  };

  const toggleMenu = () => {
    setMenuVisibility(!isMenuVisible);
  };

  return (
     <Wrapper>
       <Header>
         <IconWrapper>
           <FontAwesomeIcon icon={faCog} onClick={toggleMenu} aria-label="Toggle settings menu"/>
           { isMenuVisible ? (
              <DropDownMenu onClick={toggleMenu}>
                <DropDownItem
                  label="Change split direction"
                  onClick={toggleSplitDirection}
                  icon={faColumns}
                  text={`Split mode: ${interpreterSplitDirection}`}
                />
                { isInterpreterEnabled ?
                    <DropDownItem
                      label="Toggle editor"
                      onClick={() => toggleEditor(!isEditorEnabled)}
                      icon={faCode}
                      text={`${isEditorEnabled ? 'Hide' : 'Show' } editor`}
                    /> : undefined
                }
                { isEditorEnabled ?
                  <DropDownItem
                    label="Toggle interpreter"
                    onClick={() => toggleInterpreter(!isInterpreterEnabled)}
                    icon={faEye}
                    text={`${isInterpreterEnabled ? 'Hide' : 'Show' } interpreter`}
                  /> : undefined
                }
              </DropDownMenu>
             ) : ''
           }
         </IconWrapper>
        </Header>
       <SplitPane
         direction={interpreterSplitDirection}
         defaultSizes={[50, 50]}
         style={{height: 'calc(100% - 40px)'}}
         aria-label="Main panels">
        { isEditorEnabled ? <Editor defaultValue={editorDefaultValue} setDocumentContent={setDocumentContent} /> : undefined }
        { isInterpreterEnabled ?
           <Interpreter
             content={editorDefaultValue}
             currentBlock={currentBlock}
             timeline={timeline}
             shouldShowExtraMetadata={shouldShowExtraMetadata}
             shouldShowDebugPane={shouldShowDebugPane}
             debugPaneDirection={debugPaneDirection}
             singleBubblePresentation={singleBubblePresentation}
             clydeDocument={clydeDocument}
             setBlock={setBlock}
             addDialogueLine={addDialogueLine}
             clearTimeline={clearTimeline}
             showExtraMetadata={showExtraMetadata}
             hideExtraMetadata={hideExtraMetadata}
             showDebugPane={showDebugPane}
             hideDebugPane={hideDebugPane}
             setDebugPaneDirection={setDebugPaneDirection}
             enableSingleBubbleDialogue={enableSingleBubbleDialogue}
             disableSingleBubbleDialogue={disableSingleBubbleDialogue}
             chooseOption={chooseOption}
             events={events}
             notifyEvent={notifyEvent}
             clearEvents={clearEvents}
         />: undefined }
       </SplitPane>
    </Wrapper>
  );
};

MainPanels.propTypes = {
  isEditorEnabled: PropTypes.bool,
  isInterpreterEnabled: PropTypes.bool,
  toggleProjectTree: PropTypes.func,
  toggleEditor: PropTypes.func,
  toggleInterpreter: PropTypes.func,
  interpreterSplitDirection: PropTypes.string,
  editorDefaultValue: PropTypes.string,
  setDocumentContent: PropTypes.func,

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

  notifyEvent: PropTypes.func,
  clearEvents: PropTypes.func,
};


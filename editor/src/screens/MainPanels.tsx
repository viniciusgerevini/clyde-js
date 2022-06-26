import { addIds } from '@clyde-lang/parser';
import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCog,
  faColumns,
  faCode,
  faEye,
  faSlidersH,
  faHighlighter,
} from '@fortawesome/free-solid-svg-icons'

import SplitPane from './SplitPane';
import DropDownMenu, { DropDownItem } from './DropdownMenu';

import Editor from '../editor/Editor';
import Interpreter from '../interpreter/Interpreter';
import EditorSettingsModal from '../editor/EditorSettingsModal';

const Wrapper = styled.div`
  height: 100%;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
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
  margin-right: 10px;
`;

export interface MainPanelsParams {
  // interface
  isEditorEnabled?: boolean;
  isInterpreterEnabled?: boolean;
  toggleEditor: Function;
  toggleInterpreter: Function;
  interpreterSplitDirection?: "horizontal" | "vertical";
  changeInterpreterSplitDirection: Function;
  // editor
  editorDefaultValue: any;
  setDocumentContent: Function;
  updateEditorPreference: Function;
  editorPreferences: {[key: string]: any};
  // interpreter
  currentBlock: any;
  timeline: any;
  shouldShowExtraMetadata: boolean;
  shouldShowDebugPane: boolean;
  singleBubblePresentation: boolean;
  document: any;
  setBlock: any;
  addDialogueLine: any;
  clearTimeline: any;
  showExtraMetadata: any;
  hideExtraMetadata: any;
  showDebugPane: any;
  hideDebugPane: any;
  enableSingleBubbleDialogue: any;
  disableSingleBubbleDialogue: any;
  chooseOption: any;
  events: any;
  notifyEvent: any;
  clearEvents: any;
}

export default function MainPanels(props: MainPanelsParams) {
  const {
    // interface
    isEditorEnabled = true,
    isInterpreterEnabled = true,
    toggleEditor,
    toggleInterpreter,
    interpreterSplitDirection = 'horizontal',
    changeInterpreterSplitDirection,
    // editor
    editorDefaultValue,
    setDocumentContent,
    editorPreferences,
    updateEditorPreference,
    // interpreter
    currentBlock,
    timeline,
    shouldShowExtraMetadata,
    shouldShowDebugPane,
    singleBubblePresentation,
    document: clydeDocument,
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
    events,
    notifyEvent,
    clearEvents,
  } = props;

  const [isMenuVisible, setMenuVisibility] = useState(false);
  const [isEditorSettingsVisible, setEditorSettingsVisibility] = useState(false);

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

  const openEditorSettings = () => {
    setEditorSettingsVisibility(true);
  };

  const autoId = () => {
    const doc = addIds(editorDefaultValue);
    setDocumentContent(doc);
  };

  return (
     <Wrapper>
       <Header>
         <IconWrapper>
           <FontAwesomeIcon icon={faCog as any} onClick={toggleMenu} aria-label="Toggle settings menu"/>
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

                <DropDownItem
                  label="Editor preferences"
                  onClick={openEditorSettings}
                  icon={faSlidersH}
                  text="Editor preferences"
                />
              </DropDownMenu>
             ) : ''
           }
         </IconWrapper>

          <IconWrapper>
            <FontAwesomeIcon icon={faHighlighter as any} title="Auto-generate line ids" onClick={autoId}/>
          </IconWrapper>
        </Header>
       <SplitPane
         direction={interpreterSplitDirection}
         defaultSizes={[50, 50]}
         style={{height: 'calc(100% - 40px)'}}
         aria-label="Main panels">
        { isEditorEnabled ?
          <Editor
              defaultValue={editorDefaultValue}
              setDocumentContent={setDocumentContent}
              notifyChange={addDialogueLine}
              preferences={editorPreferences}
           /> : undefined }
        { isInterpreterEnabled ?
           <Interpreter
             content={editorDefaultValue}
             currentBlock={currentBlock}
             timeline={timeline}
             shouldShowExtraMetadata={shouldShowExtraMetadata}
             shouldShowDebugPane={shouldShowDebugPane}
             singleBubblePresentation={singleBubblePresentation}
             clydeDocument={clydeDocument}
             setBlock={setBlock}
             addDialogueLine={addDialogueLine}
             clearTimeline={clearTimeline}
             showExtraMetadata={showExtraMetadata}
             hideExtraMetadata={hideExtraMetadata}
             showDebugPane={showDebugPane}
             hideDebugPane={hideDebugPane}
             enableSingleBubbleDialogue={enableSingleBubbleDialogue}
             disableSingleBubbleDialogue={disableSingleBubbleDialogue}
             chooseOption={chooseOption}
             events={events}
             notifyEvent={notifyEvent}
             clearEvents={clearEvents}
         />: undefined }
       </SplitPane>
      { isEditorSettingsVisible ?
        <EditorSettingsModal updatePreference={updateEditorPreference} preferences={editorPreferences} onCloseClick={() => setEditorSettingsVisibility(false)} />
      : undefined }
    </Wrapper>
  );
};



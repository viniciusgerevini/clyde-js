import React, { useState, useRef, useEffect } from "react";
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCog,
  faRedoAlt,
  faFastForward,
  faBug,
  faComment,
  faComments,
  faLifeRing,
  faSave,
  faReceipt,
  faGhost,
  faTimes,
  faColumns,
  faHandSparkles,
} from '@fortawesome/free-solid-svg-icons'

import { Interpreter as ClydeInterpreter } from 'clyde-interpreter';
import { Parser } from 'clyde-parser';

import SplitPane from '../screens/SplitPane';
import DropDownMenu, { DropDownItem } from '../screens/DropdownMenu';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const InterpreterScreenWrapper = styled.div`
  width: auto;
  background: #eee;
  overflow: scroll;
`;

const InterpreterToolbarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: #444;
  padding: 0px 10px;
  height: 40px;

  > svg {
    cursor: pointer;
    font-size: 1.5em;
    margin: 0px 20px;
    &:hover {
      color: #555;
    }
  }
`;

const DebugPane = styled.div`
`;

const IconWrapper = styled.span`
  cursor: pointer;
  position: relative;
  margin: 0px 20px;
  > svg {
    font-size: 1.5em;
    &:hover {
      color: #222;
    }
  }
`;

const DialogueBubble = styled.div`
  width: auto;
  background-color: #efccef;
  margin: 10px 10px;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: default;
`;

const DialogueContent = styled.div`
`;

const DialogueSpeaker = styled.div`
  margin-bottom: 5px;
  font-weight: 500;
`;

const DialogueOptionsList = styled.ol`
  margin-left: 10px;
  list-style-type: decimal;
  list-style-position: inside;
`;

const DialogueOption = styled.li`
  opacity: ${p => p.optionSelected !== undefined && p.optionSelected !== p.index ? 0.5 : 1 };
  ${p => p.optionSelected === p.index ? 'font-weight: 600;' : '' }
  cursor: ${p => p.optionSelected === undefined ? 'pointer' : 'default' };
  margin: 4px;

  span:hover {
    ${p => p.optionSelected !== undefined ? '' : 'font-weight: 600;' }
  }
`;

const InfoBubble = styled.div `
  text-align: center;
  width: auto;
  background-color: #eeeeee;
  margin: 10px 10px;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: default;
`;

const ErrorBubble = styled.div`
  text-align: center;
  width: auto;
  background-color: #ffeeee;
  margin: 10px 10px;
  padding: 30px 20px;
  border-radius: 5px;
  cursor: default;
  font-weight: 500;
  display: flex;
  //align-items: center;
  justify-content: center;
  white-space: pre-line;
  line-height: 26px;
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
    ...props } = p;
  const [lastContent, setLastContent] = useState(content);
  const [persistedDialogue, setDialogue] = useState();
  let dialogue = persistedDialogue;
  // const dictionary = argv.translation ? await getTranslationDictionary(argv.translation) : undefined;
  // const data = argv['save-data'] ? loadSaveFile(argv['save-data']) : undefined;
  // dialogue.on(dialogue.events.VARIABLE_CHANGED, trackInternalChanges('variable', events));
  // dialogue.on(dialogue.events.EVENT_TRIGGERED, trackInternalChanges('event', events));
  let doc;
  let errorMessage;

  try {
    const parser = Parser();
    doc = parser.parse(`${content || ''}\n`);

    if (!dialogue || content !== lastContent) {
      setLastContent(content);
      dialogue = ClydeInterpreter(doc);
      if (currentBlock) {
        dialogue.begin(currentBlock);
        setBlock(currentBlock);
      }
      setDialogue(dialogue);
    }
  } catch (e) {
    errorMessage = e.message;
    const parser = Parser();
    doc = parser.parse(`${lastContent || ''}\n`);
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
      />

      <SplitPane
        direction={debugPaneDirection}
        defaultSizes={[80, 20]}
        style={{height: 'calc(100% - 40px)'}}
       >
        { !errorMessage && content && content !== '' ?
          <InterpreterScreen
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
            <DebugPane aria-label="Debug pane">debug window
              <FontAwesomeIcon icon={faSave}/>
              <FontAwesomeIcon icon={faTimes}/>
            </DebugPane>
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

function BlockList(props) {
  const { document: doc, currentBlock, onBlockSelected } = props;
  const list = [
    ...(doc.content.length > 0 ? ['default'] : []),
    ...doc.blocks.map(b => b.name)
  ];

  const selectBlock = (event) => {
    const { value } = event.target;
    if (value === 'default') {
      onBlockSelected();
      return;
    }
    onBlockSelected(event.target.value);
  };

  return (
    <div>
      <select value={currentBlock} onChange={selectBlock} aria-label="Block selector">
        { list.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          )
        )}
      </select>
    </div>
  );
}

function InterpreterToolbar(properties) {
  const {
    doc,
    currentBlock,
    shouldShowExtraMetadata,
    shouldShowDebugPane,
    debugPaneDirection,
    singleBubblePresentation,
    setBlock,
    clearTimeline,
    showExtraMetadata,
    hideExtraMetadata,
    showDebugPane,
    hideDebugPane,
    setDebugPaneDirection,
    enableSingleBubbleDialogue,
    disableSingleBubbleDialogue,
    dialogue,
    addDialogueLine,
    chooseOption,
  } = properties;

  const [isMenuVisible, setMenuVisibility] = useState(false);

  const selectBlock = (blockName) => {
    setBlock(blockName);
    clearTimeline();
    dialogue.begin(blockName);
  };

  const toggleMenu = () => {
    setMenuVisibility(!isMenuVisible);
  };

  const toggleMultipleBubbles = () => {
    if (singleBubblePresentation) {
      disableSingleBubbleDialogue();
    } else {
      enableSingleBubbleDialogue();
    }
  };

  const toggleExtraMetadata = () => {
    if (shouldShowExtraMetadata) {
      hideExtraMetadata();
    } else {
      showExtraMetadata();
    }
  };

  const toggleDebugPane = () => {
    if (shouldShowDebugPane) {
      hideDebugPane();
    } else {
      showDebugPane();
    }
  };

  const toggleSplitDirection = () => {
    if ( debugPaneDirection === 'vertical') {
      setDebugPaneDirection('horizontal');
    } else {
      setDebugPaneDirection('vertical');
    }

    if (!shouldShowDebugPane) {
      showDebugPane()
    }
  };

  const restart = () => {
    dialogue.begin(currentBlock);
    clearTimeline();
  };

  const forwardToNextOption = () => {
    const line = dialogue.getContent();
    addDialogueLine(line);

    if (!line || line.type === 'options') {
      return line;
    }

    return forwardToNextOption();
  };

  const poltergeist = () => {
    const optionList = forwardToNextOption();

    if (!optionList) {
      return;
    }

    const choice = Math.floor(Math.random() * optionList.options.length);
    chooseOption(choice);
    dialogue.choose(choice);

    poltergeist();
  };

  const cleanMemory = () => {
    dialogue.clearData();
    addDialogueLine({ type: 'INTERPRETER_INFO', text: 'Memory cleared'})
    dialogue.begin(currentBlock);
    clearTimeline();
  };

  return (
    <InterpreterToolbarWrapper>
      <BlockList document={doc} currentBlock={currentBlock} onBlockSelected={selectBlock}/>
      <FontAwesomeIcon icon={faRedoAlt} title="Restart dialogue" onClick={restart}/>

      <FontAwesomeIcon icon={faFastForward} title="Forward untill next choice" onClick={forwardToNextOption}/>

      <FontAwesomeIcon icon={faGhost} title="Execute Poltergeist mode (auto anwser)" onClick={poltergeist}/>

      <FontAwesomeIcon icon={faHandSparkles} title="Clear memory" onClick={cleanMemory}/>

      <FontAwesomeIcon
        icon={ singleBubblePresentation ? faComments : faComment }
        title={`Set ${singleBubblePresentation ? 'multi' : 'single'} bubble dialogue`}
        onClick={toggleMultipleBubbles}
      />

      <IconWrapper>
        <FontAwesomeIcon icon={faCog} onClick={toggleMenu} title="Interpreter options"/>
        { isMenuVisible ? (
          <DropDownMenu onClick={toggleMenu} style={{ width: '280px' }}>

            <DropDownItem
              label="Toggle extra metadata"
              onClick={toggleExtraMetadata}
              icon={faReceipt}
              text={`${shouldShowExtraMetadata ? 'Hide' : 'Show'} metadata`}
            />

            <DropDownItem
              label="Toggle debug pane"
              onClick={toggleDebugPane}
              icon={faBug}
              text={`${shouldShowDebugPane ? 'Hide' : 'Show'} debug pane`}
              />
            <DropDownItem
              label="Change debug pane split direction"
              onClick={toggleSplitDirection}
              icon={faColumns}
              text={`Debug pane split: ${debugPaneDirection === 'horizontal' ? 'vertical': 'horizontal'}`}
            />

            <DropDownItem
              label="Help"
              //onClick={showHelpModal}
              icon={faLifeRing}
              text={'Help'}
              />
           </DropDownMenu>
          ) : ''
        }
      </IconWrapper>
    </InterpreterToolbarWrapper>
  );
}


function InterpreterScreen(props) {
  const {
    timeline,
    shouldShowExtraMetadata,
    singleBubblePresentation,
    addDialogueLine,
    style,
    dialogue,
    chooseOption,
  } = props;

  const next = () => {
    const line = dialogue.getContent();
    if (line && line.type === 'options' && timeline.length > 0 && timeline[timeline.length - 1].type === 'options') {
      return;
    }

    if (!line && !timeline[timeline.length - 1]) {
      return;
    }
    addDialogueLine(line);
  };

  const choose = (option) => {
    dialogue.choose(option);
    chooseOption(option);
    next();
  };

  const scrollableRef = useRef(null)

  const scrollToBottom = () => {
    scrollableRef.current.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [timeline]);

  return (
      <InterpreterScreenWrapper onClick={next} style={style} aria-label="Interpreter Dialogue Timeline">
        {!timeline || !timeline.length ? <InfoBubble>Dialogue not started. Click for next line.</InfoBubble> : ''}
        {
          singleBubblePresentation ?
            ( timeline.length ?  <DialogueEntry line={timeline[timeline.length - 1]} onSelection={choose} /> : undefined )
          :
            timeline.map((line, key) => {
                return <DialogueEntry line={line} key={key} onSelection={choose}/>
            })
        }
        <div ref={scrollableRef}/>
      </InterpreterScreenWrapper>
  );
}

function DialogueEntry(props) {
  const {
    line,
    onSelection
  } = props;

  if (line === undefined) {
    return <InfoBubble>DIALOGUE ENDED</InfoBubble>;
  }

  if (line.type === 'dialogue') {
    return <DialogueLine {...line}/>
  }

  if (line.type === 'options') {
    return <DialogueOptions {...line} onSelection={onSelection}/>
  }

  return <InfoBubble>{line.text}</InfoBubble>
}

function DialogueLine(props) {
  const {
    speaker,
    text
  } = props;

  return (
    <DialogueBubble>
      { speaker ? <DialogueSpeaker>{speaker}</DialogueSpeaker> : undefined }
      <DialogueContent>
        {text}
      </DialogueContent>
    </DialogueBubble>
  );
}

function DialogueOptions(props) {
  const {
    speaker,
    name,
    options,
    onSelection,
    selected
  } = props;

  const select = (option) => {
    if (selected !== undefined) {
      return;
    }
    onSelection(option);
  };

  return (
    <DialogueBubble>
      { speaker ? <DialogueSpeaker>{speaker}</DialogueSpeaker> : undefined }
      <DialogueContent>
        {name}
        <DialogueOptionsList>
          { options.map((option, index) => (
            <DialogueOption
              key={index}
              optionSelected={selected}
              index={index}
            >
              <span onClick={e => { e.stopPropagation(); select(index) }}>{option.label}</span>
            </DialogueOption>
            ))}
        </DialogueOptionsList>
      </DialogueContent>
    </DialogueBubble>
  );
}


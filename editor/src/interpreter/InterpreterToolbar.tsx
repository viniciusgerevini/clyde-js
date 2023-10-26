// @ts-nocheck
import styled from 'styled-components';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRedoAlt,
  faFastForward,
  faBug,
  faComment,
  faComments,
  faReceipt,
  faGhost,
  faHandSparkles,
} from '@fortawesome/free-solid-svg-icons'

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


export default function InterpreterToolbar(properties) {
  const {
    doc,
    currentBlock,
    shouldShowExtraMetadata,
    shouldShowDebugPane,
    singleBubblePresentation,
    setBlock,
    clearTimeline,
    showExtraMetadata,
    hideExtraMetadata,
    showDebugPane,
    hideDebugPane,
    enableSingleBubbleDialogue,
    disableSingleBubbleDialogue,
    dialogue,
    addDialogueLine,
    chooseOption,
    clearEvents,
  } = properties;

  const selectBlock = (blockName) => {
    setBlock(blockName);
    clearTimeline();
    dialogue.start(blockName);
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

  const restart = () => {
    dialogue.start(currentBlock);
    clearTimeline();
  };

  const forwardToNextOption = () => {
    const line = dialogue.getContent();
    addDialogueLine(line);

    if (line.type === 'end' || line.type === 'options') {
      return line;
    }

    return forwardToNextOption();
  };

  const poltergeist = () => {
    const optionList = forwardToNextOption();

    if (optionList.type == "end") {
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
    dialogue.start(currentBlock);
    clearEvents();
    clearTimeline();
  };

  return (
    <InterpreterToolbarWrapper>
      <BlockList document={doc} currentBlock={currentBlock} onBlockSelected={selectBlock}/>
      <FontAwesomeIcon icon={faRedoAlt} title="Restart dialogue" onClick={restart}/>

      <FontAwesomeIcon icon={faFastForward} title="Forward until next choice" onClick={forwardToNextOption}/>

      <FontAwesomeIcon icon={faGhost} title="Execute Poltergeist mode (auto anwser)" onClick={poltergeist}/>

      <FontAwesomeIcon icon={faHandSparkles} title="Clear memory" onClick={cleanMemory}/>

      <FontAwesomeIcon
        icon={ singleBubblePresentation ? faComments : faComment }
        title={`Set ${singleBubblePresentation ? 'multi' : 'single'} bubble dialogue`}
        onClick={toggleMultipleBubbles}
      />

      <FontAwesomeIcon icon={faReceipt} onClick={toggleExtraMetadata} title={`${shouldShowExtraMetadata ? 'Hide' : 'Show'} metadata`}/>

      <FontAwesomeIcon icon={faBug} onClick={toggleDebugPane} title={`${shouldShowDebugPane ? 'Hide' : 'Show'} debug pane`}/>
    </InterpreterToolbarWrapper>
  );
}

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


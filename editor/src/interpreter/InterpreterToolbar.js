import React, { useState } from "react";
import styled from 'styled-components';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCog,
  faRedoAlt,
  faFastForward,
  faBug,
  faComment,
  faComments,
  faReceipt,
  faGhost,
  faColumns,
  faHandSparkles,
} from '@fortawesome/free-solid-svg-icons'

import DropDownMenu, { DropDownItem } from '../screens/DropdownMenu';

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

export default function InterpreterToolbar(properties) {
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
    clearEvents,
  } = properties;

  const [isMenuVisible, setMenuVisibility] = useState(false);

  const selectBlock = (blockName) => {
    setBlock(blockName);
    clearTimeline();
    dialogue.start(blockName);
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
    dialogue.start(currentBlock);
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
    dialogue.start(currentBlock);
    clearEvents();
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
           </DropDownMenu>
          ) : ''
        }
      </IconWrapper>
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


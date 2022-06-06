import React from "react";
import styled from 'styled-components';

import { InfoBubble } from './Bubbles';

const DialogueBubble = styled.div`
  width: auto;
  background-color: #fff5da;
  color: #34383c;
  margin: 10px 10px;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: default;
  position: relative;
`;

const DialogueContent = styled.div`
  white-space: pre;
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
  position: relative;
  opacity: ${p => p.optionSelected !== undefined && p.optionSelected !== p.index ? 0.5 : 1 };
  ${p => p.optionSelected === p.index ? 'font-weight: 600;' : '' }
  cursor: ${p => p.optionSelected === undefined ? 'pointer' : 'default' };
  margin: 4px;

  > span:hover {
    ${p => p.optionSelected !== undefined ? '' : 'font-weight: 600;' }
  }
`;

const DialogueMetadataWrapper = styled.span`
  color: #444;
  font-weight: normal;
  background-color: rgba(245,235,208, 1);
  opacity: 0.8;
  border-radius: 5px;
  padding-right: 10px;
  margin-left: 10px;

  label {
    margin-left: 10px;
    font-weight: 500;
  }
`;

export default function DialogueEntry(props) {
  const {
    line,
    onSelection,
    showMetadata
  } = props;

  if (line === undefined) {
    return <InfoBubble>DIALOGUE ENDED</InfoBubble>;
  }

  if (line.type === 'line') {
    return <DialogueLine {...line} showMetadata={showMetadata}/>
  }

  if (line.type === 'options') {
    return <DialogueOptions {...line} onSelection={onSelection} showMetadata={showMetadata}/>
  }

  return <InfoBubble>{line.text === '<DIALOGUE_CHANGED>' ? 'DIALOGUE CHANGED' : line.text }</InfoBubble>
}

function DialogueLine(props) {
  const {
    id,
    tags,
    speaker,
    text,
    showMetadata
  } = props;

  return (
    <DialogueBubble>
      { speaker ? <DialogueSpeaker>{speaker}</DialogueSpeaker> : undefined }
      <DialogueContent>
        {text} <DialogueMetadata id={id} tags={tags} isVisible={showMetadata}/>
      </DialogueContent>
    </DialogueBubble>
  );
}

function DialogueOptions(props) {
  const {
    id,
    tags,
    speaker,
    name,
    options,
    onSelection,
    selected,
    showMetadata
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
        {name} <DialogueMetadata id={id} tags={tags} isVisible={showMetadata}/>
        <DialogueOptionsList>
          { options.map((option, index) => (
            <DialogueOption
              key={index}
              optionSelected={selected}
              index={index}
            >
              <span onClick={e => { e.stopPropagation(); select(index) }}>{option.label} <DialogueMetadata {...option} isVisible={showMetadata}/></span>

            </DialogueOption>
            ))}
        </DialogueOptionsList>
      </DialogueContent>
    </DialogueBubble>
  );
}

function DialogueMetadata({ id, tags, isVisible }) {
  if (!isVisible || (id === undefined && tags === undefined )) {
    return<span></span>;
  }

  return <DialogueMetadataWrapper aria-label="metadata">
    { id !== undefined ? <span aria-label="line id"><label>id:</label> {id}</span>: undefined } { tags !== undefined ? <span aria-label="line tags"><label>tags:</label> {tags.join(', ')}</span>: undefined }
  </DialogueMetadataWrapper>
}


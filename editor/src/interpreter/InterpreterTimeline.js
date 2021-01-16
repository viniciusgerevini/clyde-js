import React, { useRef, useEffect } from "react";
import styled from 'styled-components';

import { InfoBubble } from './Bubbles';
import DialogueEntry from './DialogueEntry';

const InterpreterScreenWrapper = styled.div`
  width: auto;
  overflow: scroll;
`;

export default function InterpreterTimeline(props) {
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
            ( timeline.length ?  <DialogueEntry line={timeline[timeline.length - 1]} onSelection={choose} showMetadata={shouldShowExtraMetadata} /> : undefined )
          :
            timeline.map((line, key) => {
                return <DialogueEntry line={line} key={key} onSelection={choose} showMetadata={shouldShowExtraMetadata}/>
            })
        }
        <div ref={scrollableRef}/>
      </InterpreterScreenWrapper>
  );
}


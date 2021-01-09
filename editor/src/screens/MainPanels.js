import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import SplitPane from './SplitPane';

import Editor from '../editor/Editor';
import Interpreter from '../interpreter/Interpreter';

const Wrapper = styled.div`
  height: 100%;
`;

export default function MainPanels(props) {
  const {
    isEditorEnabled = true,
    isInterpreterEnabled = true,
    toggleEditor,
    toggleInterpreter,
    interpreterSplitDirection = 'vertical',
    changeInterpreterSplitDirection
  } = props;
  // on mouse drag, calculate

  return (
     <Wrapper>
       <span aria-label="Toggle editor" onClick={() => toggleEditor(!isEditorEnabled)}>editor </span>
       <span aria-label="Toggle interpreter" onClick={() => toggleInterpreter(!isInterpreterEnabled)}>interpreter </span>
       <span aria-label="Set as horizontal" onClick={() => changeInterpreterSplitDirection('horizontal')}>horizontal </span>
       <span aria-label="Set as vertical" onClick={() => changeInterpreterSplitDirection('vertical')}>vertical </span>
       <SplitPane direction={interpreterSplitDirection} defaultSizes={[50, 50]} aria-label="Main panels">
        { isEditorEnabled ? <Editor/> : undefined }
        { isInterpreterEnabled ? <Interpreter/>: undefined }
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
};

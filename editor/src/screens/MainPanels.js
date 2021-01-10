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
    isEditorEnabled = true,
    isInterpreterEnabled = true,
    toggleEditor,
    toggleInterpreter,
    interpreterSplitDirection = 'vertical',
    changeInterpreterSplitDirection,
    editorDefaultValue
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
                <DropDownItem
                  label="Toggle editor"
                  onClick={() => toggleEditor(!isEditorEnabled)}
                  icon={faCode}
                  text={`${isEditorEnabled ? 'Hide' : 'Show' } editor`}
                />
                <DropDownItem
                  label="Toggle interpreter"
                  onClick={() => toggleInterpreter(!isInterpreterEnabled)}
                  icon={faEye}
                  text={`${isInterpreterEnabled ? 'Hide' : 'Show' } interpreter`}
                />
              </DropDownMenu>
             ) : ''
           }
         </IconWrapper>
        </Header>
       <SplitPane direction={interpreterSplitDirection} defaultSizes={[50, 50]} aria-label="Main panels">
        { isEditorEnabled ? <Editor defaultValue={editorDefaultValue}/> : undefined }
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
  editorDefaultValue: PropTypes.string,
};


import React from 'react';
import Split from 'react-split';
import styled from 'styled-components';

import Editor from '../editor/Editor';
import Interpreter from '../interpreter/Interpreter';
import ProjectTree from '../project-tree/Tree';

const Wrapper = styled.div`
  height: 100%;
  .split {
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
      display: flex;
      align-items: strecth;
      height: 100%;
  }
  .split-horizontal {
    flex-direction: row;
  }
  .split-vertical {
    flex-direction: column;
  }

  .gutter {
      background-color: #eee;
      background-repeat: no-repeat;
      background-position: 50%;
  }

  .gutter.gutter-horizontal {
     // background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
      cursor: col-resize;
  }

  .gutter.gutter-vertical {
     // background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
      cursor: row-resize;
  }
`;

export default function MainPanels() {
  // TODO tree toggle
  // TODO editor toggle
  // TODO interpreter toggle
  // TODO interpreter horizontal / vertical toggle
  return (
    <Wrapper>
    <Split
      className="split split-horizontal"
      direction="horizontal"
      sizes={[20, 80]}
      minSize={200}
      elementStyle={elementStyle}
      gutterStyle={gutterStyle}
    >
        <ProjectTree/>
        <Split
          className="split split-horizontal"
          direction="horizontal"
          sizes={[50, 50]}
          elementStyle={elementStyle}
          gutterStyle={gutterStyle}
        >
          <Editor/>
          <Interpreter/>
        </Split>
    </Split>
    </Wrapper>
  );
};

const elementStyle = (_dimension, size, gutterSize) => {
  return {
    'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)',
  }
};

const gutterStyle = (_dimension, gutterSize) => {
  return {
    'flex-basis': gutterSize + 'px',
  }
};


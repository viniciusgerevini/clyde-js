import React from "react";
import AceEditor from "react-ace";
import useResizeObserver from "use-resize-observer";
import styled from 'styled-components';

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
// import "ace-builds/src-noconflict/keybinding-vim";

/* keyboardHandler='vim' */

const EditorWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

export default function Editor(props) {
  const { ref, width = 500, height = 500 } = useResizeObserver();

  // const onChange = (_newValue) => {
  //   console.log("change", newValue);
  // };

  return (
    <EditorWrapper ref={ref} {...props} aria-label="Text editor">
      <AceEditor
        mode="javascript"
        theme="github"
        //onChange={onChange}
        name="mainEditor"
        width={`${width}px`}
        height={`${height}px`}
        editorProps={{ $blockScrolling: true }}
      />
    </EditorWrapper>
  );
}

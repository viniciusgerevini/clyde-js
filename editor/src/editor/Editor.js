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
`;

export default function Editor() {
  const { ref, width = 500, height = 500 } = useResizeObserver();

  const onChange = (_newValue) => {
  //   console.log("change", newValue);
  };

  return (
    <EditorWrapper ref={ref}>
      <AceEditor
        mode="javascript"
        theme="github"
        onChange={onChange}
        name="mainEditor"
        width={width - 10}
        height={height}
        editorProps={{ $blockScrolling: true }}
      />
    </EditorWrapper>
  );
}

import React from "react";
import AceEditor from "react-ace";
import useResizeObserver from "use-resize-observer";
import styled from 'styled-components';

import "ace-builds/src-noconflict/theme-dracula";
// import "ace-builds/src-noconflict/keybinding-vim";
/* keyboardHandler='vim' */

import ClydeMode from './clyde-ace-mode';

const EditorWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

export default function Editor({ defaultValue, setDocumentContent, ...props}) {
  const { ref, width = 500, height = 500 } = useResizeObserver();

  const onBeforeLoad = (editor) => {
    ClydeMode(editor);
  };

  const onChange = (value) => {
    setDocumentContent(value);
  };

  return (
    <EditorWrapper ref={ref} {...props} aria-label="Text editor">
      <AceEditor
        defaultValue={defaultValue}
        mode="clyde"
        theme="dracula"
        onBeforeLoad={onBeforeLoad}
        onChange={onChange}
        name="mainEditor"
        width={`${width}px`}
        height={`${height}px`}
        editorProps={{ $blockScrolling: true }}
        fontSize="16px"
        debounceChangePeriod={1000}
      />
    </EditorWrapper>
  );
}

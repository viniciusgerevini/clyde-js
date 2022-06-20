import AceEditor from "react-ace";
import useResizeObserver from "use-resize-observer";
import styled from 'styled-components';

import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-tomorrow_night_eighties";
import "ace-builds/src-noconflict/theme-textmate";

import "ace-builds/src-noconflict/keybinding-vim";

import ClydeMode from './clyde-ace-mode';

const EditorWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const defaultConfig = {
  theme: 'dracula',
  fontSize: 16,
  tabSize: 4,
  highlightActiveLine: false,
  lineWrap: false,
  useSoftTabs: true,
  showInvisibles: false,
  scrollPastEnd: false
};

interface EditorParams {
  defaultValue: string;
  setDocumentContent: Function;
  notifyChange: Function;
  preferences: {[key: string]: any};
  props?: any[];
}

export default function Editor({ defaultValue, setDocumentContent, notifyChange, preferences = defaultConfig, ...props}: EditorParams) {
  const { ref, width = 500, height = 500 } = useResizeObserver();

  const onBeforeLoad = (editor: any) => {
    ClydeMode(editor);
  };

  const onChange = (value: string) => {
    setDocumentContent(value);
    if (value !== defaultValue) {
      notifyChange({ text: '<DIALOGUE_CHANGED>'});
    }
  };

  return (
    <EditorWrapper ref={ref} {...props} aria-label="Text editor">
      <AceEditor
        defaultValue={defaultValue}
        mode="clyde"
        theme={preferences.theme}
        onBeforeLoad={onBeforeLoad}
        onChange={onChange}
        name="mainEditor"
        width={`${width}px`}
        height={`${height}px`}
        editorProps={{ $blockScrolling: true }}
        fontSize={preferences.fontSize}
        tabSize={preferences.tabSize}
        debounceChangePeriod={1000}
        keyboardHandler={preferences.vimMode ? 'vim' : undefined}
        highlightActiveLine={preferences.highlightActiveLine}
        setOptions={{
          showPrintMargin: false,
          wrapBehavioursEnabled: preferences.lineWrap,
          wrap: preferences.lineWrap,
          useSoftTabs: preferences.useSoftTabs,
          showInvisibles: preferences.showInvisibles,
          scrollPastEnd: preferences.scrollPastEnd,
          navigateWithinSoftTabs: true,
        }}
      />
    </EditorWrapper>
  );
}

import React from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
// import "ace-builds/src-noconflict/keybinding-vim";

/* keyboardHandler='vim' */

function onChange(newValue) {
  console.log("change", newValue);
}

export default function Editor() {
  return (
    <AceEditor
      mode="java"
      theme="github"
      onChange={onChange}
      name="UNIQUE_ID_OF_DIV"
      editorProps={{ $blockScrolling: true }}
    />
  );
}

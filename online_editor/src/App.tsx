import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import "./App.css";
import { Editor } from "./editor/Editor.js";
import { Player } from "./player/Player.js";

function App() {
  const [dialogue, setDialogue] = useState("");

  return (
    <div className="app-container">
      <header>
        <h1>Clyde Online Editor</h1>
        <div>
          Clyde is a language for writing game dialogues.{" "}
          <a href="https://thisisvini.com/clyde">Website and docs</a>
        </div>
      </header>
      <main>
        <Group>
          <Panel>
            <div className="editor-panel">
              <Editor onContentChanged={(content) => setDialogue(content)} />
            </div>
          </Panel>
          <Separator>
            <div className="separator"></div>
          </Separator>
          <Panel>
            <div className="player-panel">
              <Player dialogue={dialogue} />
            </div>
          </Panel>
        </Group>
      </main>
    </div>
  );
}

export default App;

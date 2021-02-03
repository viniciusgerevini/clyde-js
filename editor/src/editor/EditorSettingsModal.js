import React from 'react';
import styled from 'styled-components';

import Modal from '../screens/Modal';

const Preference = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 10px;

  > input {
    margin-right: 10px;
  }

  > select, > input[type="number"] {
    margin-left: 10px;
  }
`;

export default function EditorSettingsModal(props) {
  const {
    onCloseClick,
    updatePreference,
    preferences,
  } = props;

  const update = (item) => {
    updatePreference(item.target.name, item.target.checked);
  };

  const updateNumber = (item) => {
    updatePreference(item.target.name, Number(item.target.value));
  };

  const updateTheme = (item) => {
    updatePreference(item.target.name, item.target.value);
  };

  const themes = [
    { value: 'dracula', name: 'Dracula' },
    { value: 'monokai', name: 'Monokai' },
    { value: 'tomorrow_night_eighties', name: 'Tomorrow Night Eighties' },
    { value: 'tomorrow', name: 'Tomorrow' },
    { value: 'textmate', name: 'Textmate' },
  ];

  return  (
  <Modal title="Editor preferences" actions={[{ label: 'Close', onClick: () => onCloseClick() }]}>
    <Preference>
      <input
        type="checkBox"
        name="highlightActiveLine"
        onChange={update}
        checked={preferences.highlightActiveLine}
      />
      <label htmlFor="highlightActiveLine">Highlight active line</label>
    </Preference>
    <Preference>
      <input type="checkBox"  name="showInvisibles"
        onChange={update}
        checked={preferences.showInvisibles}
    />
    <label htmlFor="showInvisibles">Show invisibles</label>
    </Preference>
    <Preference>
      <input type="checkBox"  name="vimMode"
        onChange={update}
        checked={preferences.vimMode}
    />
    <label htmlFor="vimMode">Enable vim mode</label>
    </Preference>
    <Preference>
      <input type="checkBox"  name="lineWrap"
        onChange={update}
        checked={preferences.lineWrap}
      />
      <label htmlFor="line_wrap">Enable line wrap</label>
    </Preference>
    <Preference>
      <input type="checkBox"  name="scrollPastEnd"
        onChange={update}
        checked={preferences.scrollPastEnd}
      />
      <label htmlFor="scrollPastEnd"></label> Enable scroll past end
    </Preference>
    <Preference>
      <input type="checkBox"  name="useSoftTabs"
        onChange={update}
        checked={preferences.useSoftTabs}
      />
      <label htmlFor="useSoftTabs">Enable soft tabs</label>
    </Preference>
    <Preference>
      <label htmlFor="tabSize">Tab size</label>
      <input type="number"  name="tabSize" max="10" min="1" onChange={updateNumber} value={preferences.tabSize}/>
    </Preference>
    <Preference>
      <label htmlFor="fontSize">Font size</label>
      <input type="number" name="fontSize" max="70" min="1" onChange={updateNumber} value={preferences.fontSize}/>px
    </Preference>
    <Preference>
      <label htmlFor="theme">Theme</label>
      <select name="theme" value={preferences.theme} onChange={updateTheme}>
        { themes.map((theme, key) => <option key={key} value={theme.value}>{theme.name}</option>)}
      </select>
    </Preference>
  </Modal>
  );
}

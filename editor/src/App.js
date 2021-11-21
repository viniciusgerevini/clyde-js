import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux';

import throttle from 'lodash/throttle';

import reducer from './redux/reducers';
import MainPanelsContainer from './screens/MainPanelsContainer';

import { loadState, saveState } from './storage/local-storage';

const load = () => {
  const data = loadState() || { editor: {} };


  if (!data.editor?.currentValue) {
    data.editor.currentValue = `--
--
-- This is a sample dialogue.
--

Narrator: Hello there!
Player: Hi!
Narrator: What do you want to talk about?
  + Life
    -> about life <-
  + The universe
    -> about the universe <-
  * Everything else... #some_tag
    -> about everything else <-
  + Earth
    -> about earth <-
  + Nothing
    -> goodbye <-


== about life
Player: I want to talk about life!
Narrator: Well! That's complicated...
<-


== about the universe
Player: I want to talk about the universe!
( shuffle
  - Narrator: That's too complex!
  - Narrator: Maybe another time.
  - Narrator: It's big...
              I think that's all.
)
<-


== about everything else
Player: What about everything else?
Narrator: I don't have time for this... #bored
<-

== about earth
Player: What do you know about earth?
( sequence
 - Narrator: It's mostly harmless.
 - Narrator: This again?
             I've already told you, mostly harmless.
 -
   Narrator: Why do you want to know so much about it?
   Player: I don't know...
   Narrator: So.. don't ask!

 - Narrator: I'm not talking about this anymore.
)
<-

== goodbye
{ not alreadyIntroduced }
  Narrator: It was nice to meet you!
  Player: I can say the same. See you around!
  { set alreadyIntroduced = true }
Player: Bye!
Narrator: Good bye!
`;
  }

  return {
    editor: data.editor,
    interpreter: {
      document: undefined,
      events: [],
      timeline: [],
      ...data.interpreter
    }
  };
};

const store = configureStore({
  reducer,
  devTools: process.env.NODE_ENV !== 'production',
  preloadedState: load(),
});

store.subscribe(throttle(() => {
  const state = store.getState();
  const {
    shouldShowExtraMetadata,
    shouldShowDebugPane,
    debugPaneDirection,
    singleBubblePresentation,
  } = state.interpreter;

  saveState({
    editor: {
      preferences: state.editor.preferences,
      currentValue: state.editor.currentValue
    },
    interpreter: {
      shouldShowExtraMetadata,
      shouldShowDebugPane,
      debugPaneDirection,
      singleBubblePresentation,
    },
  });
}, 1000));


function App() {
  return (
    <Provider store={store}>
      <MainPanelsContainer />
    </Provider>
  );
}

export default App;

import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux';

import throttle from 'lodash/throttle';

import reducer from './redux/reducers';
import MainPanelsContainer from './screens/MainPanelsContainer';

import { loadState, saveState } from './storage/local-storage';

const load = () => {
  const data = loadState() || {};

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

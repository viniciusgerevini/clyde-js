import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux';

import reducer from './redux/reducers';
import MainPanelsContainer from './screens/MainPanelsContainer';

const store = configureStore({
  reducer,
  devTools: process.env.NODE_ENV !== 'production',
  preloadedState: loadState(),
})


function loadState() {
  return {
    interfaceConfig: {
      isEditorEnabled: true,
      isProjectTreeEnabled: true,
      isInterpreterEnabled: true
    }
  };
}

function App() {
  return (
    <Provider store={store}>
      <MainPanelsContainer />
    </Provider>
  );
}

export default App;

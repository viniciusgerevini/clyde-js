import { Provider } from 'react-redux';
import { store } from './redux/store';
import MainPanelsContainer from './screens/MainPanelsContainer';

function App() {
  return (
    <Provider store={store}>
      <MainPanelsContainer />
    </Provider>
  );
}

export default App;

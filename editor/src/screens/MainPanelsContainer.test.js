import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';

import {
  toggleEditor,
  toggleInterpreter,
  changeInterpreterSplitDirection,
  createEmptyState
} from '../redux/interface';

import MainPanelsContainer from './MainPanelsContainer';

describe('MainPanelsContainer', () => {
  const mockStore = configureStore();

  const createMockStore = (customState = {}) => {
    let state = createEmptyState();
    return mockStore({ interfaceConfig: { ...state, ...customState }});
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggles editor', () => {
    const store = createMockStore();

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle editor/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleEditor.toString());
    expect(action.payload).toEqual({ state: false });
  });

  it('toggles editor inverting current state', () => {
    const store = createMockStore({ isEditorEnabled: false });

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle editor/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleEditor.toString());
    expect(action.payload).toEqual({ state: true });
  });

  it('toggles interpeter', () => {
    const store = createMockStore();

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle interpreter/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleInterpreter.toString());
    expect(action.payload).toEqual({ state: false });
  });

  it('toggles interpeter inverting current state', () => {
    const store = createMockStore({ isInterpreterEnabled: false });

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle interpreter/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleInterpreter.toString());
    expect(action.payload).toEqual({ state: true });
  });

  it('changes interpreter direction to horizontal', () => {
    const store = createMockStore();

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Set as horizontal/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(changeInterpreterSplitDirection.toString());
    expect(action.payload).toEqual({ direction: 'horizontal' });
  });

  it('changes interpreter direction to vertical', () => {
    const store = createMockStore();

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Set as vertical/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(changeInterpreterSplitDirection.toString());
    expect(action.payload).toEqual({ direction: 'vertical' });
  });
});



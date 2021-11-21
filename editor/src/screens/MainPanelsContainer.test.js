import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';

import {
  toggleEditor,
  toggleInterpreter,
  changeInterpreterSplitDirection,
  createEmptyState as createEmptyInterfaceState
} from '../redux/interface';

import {
  createEmptyState as createEmptyEditorState,
  updatePreference,
} from '../redux/editor';

import {
  setBlock,
  addDialogueLine,
  clearTimeline,
  showExtraMetadata,
  hideExtraMetadata,
  showDebugPane,
  hideDebugPane,
  enableSingleBubbleDialogue,
  disableSingleBubbleDialogue,
  chooseOption,
  notifyEvent,
  clearEvents,
  createEmptyState as createInterpreterEmptyState
} from '../redux/interpreter';

import MainPanelsContainer from './MainPanelsContainer';

describe('MainPanelsContainer', () => {
  const mockStore = configureStore();

  const createMockStore = (customInterfaceState = {}, customEditorState = {}, customInterpreterState = {}) => {
    const interfaceState = createEmptyInterfaceState();
    const editorState = createEmptyEditorState();
    const interpreterState = createInterpreterEmptyState();
    return mockStore({
      interfaceConfig: { ...interfaceState, ...customInterfaceState },
      editor: { currentValue: 'hi\n', ...editorState, ...customEditorState },
      interpreter: { ...interpreterState, ...customInterpreterState },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggles editor', () => {
    const store = createMockStore();

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Toggle editor/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleEditor.toString());
    expect(action.payload).toEqual({ state: false });
  });

  it('toggles editor inverting current state', () => {
    const store = createMockStore({ isEditorEnabled: false });

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Toggle editor/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleEditor.toString());
    expect(action.payload).toEqual({ state: true });
  });

  it('toggles interpeter', () => {
    const store = createMockStore();

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Toggle interpreter/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleInterpreter.toString());
    expect(action.payload).toEqual({ state: false });
  });

  it('toggles interpeter inverting current state', () => {
    const store = createMockStore({ isInterpreterEnabled: false });

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Toggle interpreter/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(toggleInterpreter.toString());
    expect(action.payload).toEqual({ state: true });
  });

  it('changes interpreter direction', () => {
    const store = createMockStore();

    const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Change split direction/i));

    const action = store.getActions()[0];

    expect(action.type).toEqual(changeInterpreterSplitDirection.toString());
    expect(action.payload).toEqual({ direction: 'horizontal' });
  });

  it('updates editor settings', () => {
    const store = createMockStore(
      {},
      { currentValue:'Hi\n', preferences: {} },
      { timeline: [] }
    );
    const { container, getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Editor preferences/i));
    fireEvent.click(container.querySelector(`input[name="showInvisibles"]`));

    const action = store.getActions()[0];

    expect(action.type).toEqual(updatePreference.toString());
    expect(action.payload).toEqual({ name: 'showInvisibles', value: true });
  });

  describe('interpreter', () => {
    it('clears timeline', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hello from container!\nHi\n'},
        { timeline: [] }
      );
      const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByLabelText(/Restart dialogue/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(clearTimeline.toString());
    });

    it('adds dialogue line', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hello from container!\nHi\n'},
        { timeline: [] }
      );
      const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(addDialogueLine.toString());
      expect(action.payload).toEqual({ type: 'line', text: 'Hello from container!' });
    });

    it('sets starting block', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hello from container!\nHi\n'},
        { timeline: [], currentBlock: 'some_block' }
      );
      render(<Provider store={store}><MainPanelsContainer /></Provider>);

      const action = store.getActions()[0];

      expect(action.type).toEqual(setBlock.toString());
      expect(action.payload).toEqual('some_block');
    });

    it('triggers show debug pane when pane is hidden', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hi\n' },
        { timeline: [], shouldShowDebugPane: false }
      );
      const { getByLabelText, getByText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByText(/Show debug pane/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(showDebugPane.toString());
    });

    it('triggers hide debug pane when pane is visible', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hi\n' },
        { timeline: [], shouldShowDebugPane: true }
      );
      const { getByLabelText, getByText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByText(/Hide debug pane/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(hideDebugPane.toString());
    });

    it('notifies event', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'{set hi=1}\n' },
        { timeline: [], events: [], shouldShowDebugPane: true }
      );
      const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(notifyEvent.toString());
    });

    it('clears event', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue: undefined },
        { timeline: [], events: [], shouldShowDebugPane: true }
      );
      const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByLabelText(/Clear memory/i));

      const action = store.getActions()[1];

      expect(action.type).toEqual(clearEvents.toString());
    });

    it('triggers show extra metadata', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hi\n' },
        { timeline: [], shouldShowExtraMetadata: false }
      );
      const { getByLabelText, getByText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByText(/Show metadata/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(showExtraMetadata.toString());
    });

    it('triggers hide extra metadata', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hi\n' },
        { timeline: [], shouldShowExtraMetadata: true }
      );
      const { getByLabelText, getByText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByText(/Hide metadata/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(hideExtraMetadata.toString());
    });


    it('enables single bubble dialogue', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hi\n' },
        { timeline: [], singleBubblePresentation: false }
      );
      const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByLabelText(/Set single bubble dialogue/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(enableSingleBubbleDialogue.toString());
    });

    it('enables multi bubble dialogues', () => {
      const store = createMockStore(
        { isInterpreterEnabled: true },
        { currentValue:'Hi\n' },
        { timeline: [], singleBubblePresentation: true }
      );
      const { getByLabelText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByLabelText(/Set multi bubble dialogue/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(disableSingleBubbleDialogue.toString());
    });

    it('chooses option', () => {
      const content = `
what do you think?
  * yes
    nice!
  * no
    ok!
`;
      const store = createMockStore(
        { isEditorEnabled: false, isInterpreterEnabled: true },
        { currentValue: content },
        { timeline: [{ type: 'options', options: [{ label: 'yes' }]}] }
      );
      const { getByLabelText, getByText } = render(<Provider store={store}><MainPanelsContainer /></Provider>);

      fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));
      fireEvent.click(getByText(/yes/i));

      const action = store.getActions()[0];

      expect(action.type).toEqual(chooseOption.toString());
      expect(action.payload).toEqual(0);
    });
  });
});



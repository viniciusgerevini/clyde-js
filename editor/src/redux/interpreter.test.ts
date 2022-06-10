import reducers, {
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
  InterpreterState,
} from './interpreter';

describe('Interpreter reducers', () => {
  const fakeState = {} as InterpreterState;

  it('set block', () => {
    const action = setBlock('some block name');
    expect(reducers(fakeState, action)).toEqual({ currentBlock: 'some block name' });
  });

  it('add dialogue line', () => {
    const someObject = { some: 'object' };
    const action = addDialogueLine(someObject);
    expect(reducers({...fakeState, timeline: [] }, action)).toEqual({ timeline: [someObject] });
  });

  it('clear timeline', () => {
    const action = clearTimeline();
    expect(reducers({...fakeState, timeline: [1, 2 , 3] }, action)).toEqual({ timeline: [] });
  });

  it('show metadata', () => {
    const action = showExtraMetadata();
    expect(reducers(fakeState, action)).toEqual({ shouldShowExtraMetadata: true });
  });

  it('hide metadata', () => {
    const action = hideExtraMetadata();
    expect(reducers(fakeState, action)).toEqual({ shouldShowExtraMetadata: false });
  });

  it('show debug pane', () => {
    const action = showDebugPane();
    expect(reducers(fakeState, action)).toEqual({ shouldShowDebugPane: true });
  });

  it('hide debug pane', () => {
    const action = hideDebugPane();
    expect(reducers(fakeState, action)).toEqual({ shouldShowDebugPane: false });
  });

  it('enable single bubble dialogue', () => {
    const action = enableSingleBubbleDialogue();
    expect(reducers(fakeState, action)).toEqual({ singleBubblePresentation: true });
  });

  it('disable single bubble dialogue', () => {
    const action = disableSingleBubbleDialogue();
    expect(reducers(fakeState, action)).toEqual({ singleBubblePresentation: false });
  });

  it('choose option', () => {
    const action = chooseOption(0);
    expect(reducers({...fakeState, timeline: [{ type: 'options'}] }, action)).toEqual({ timeline: [{ type: 'options', selected: 0 }] });
  });

  it('do not change state when choosing option but latest event is not options', () => {
    const action = chooseOption(0);
    expect(reducers({...fakeState, timeline: [{ type: 'dialogue'}] }, action)).toEqual({ timeline: [{ type: 'dialogue' }] });
  });

  it('notify event', () => {
    const someObject = { some: 'object' };
    const action = notifyEvent(someObject);
    expect(reducers({...fakeState, events: [] }, action)).toEqual({ events: [someObject] });
  });

  it('clear events', () => {
    const action = clearEvents();
    expect(reducers({...fakeState, events: [1, 2 , 3] }, action)).toEqual({ events: [] });
  });
});


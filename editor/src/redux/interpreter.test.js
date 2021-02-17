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
} from './interpreter';

describe('Interpreter reducers', () => {
  it('set block', () => {
    const action = setBlock('some block name');
    expect(reducers({}, action)).toEqual({ currentBlock: 'some block name' });
  });

  it('add dialogue line', () => {
    const someObject = { some: 'object' };
    const action = addDialogueLine(someObject);
    expect(reducers({ timeline: [] }, action)).toEqual({ timeline: [someObject] });
  });

  it('clear timeline', () => {
    const action = clearTimeline();
    expect(reducers({ timeline: [1, 2 , 3] }, action)).toEqual({ timeline: [] });
  });

  it('show metadata', () => {
    const action = showExtraMetadata();
    expect(reducers({}, action)).toEqual({ shouldShowExtraMetadata: true });
  });

  it('hide metadata', () => {
    const action = hideExtraMetadata();
    expect(reducers({}, action)).toEqual({ shouldShowExtraMetadata: false });
  });

  it('show debug pane', () => {
    const action = showDebugPane();
    expect(reducers({}, action)).toEqual({ shouldShowDebugPane: true });
  });

  it('hide debug pane', () => {
    const action = hideDebugPane();
    expect(reducers({}, action)).toEqual({ shouldShowDebugPane: false });
  });

  it('enable single bubble dialogue', () => {
    const action = enableSingleBubbleDialogue();
    expect(reducers({}, action)).toEqual({ singleBubblePresentation: true });
  });

  it('disable single bubble dialogue', () => {
    const action = disableSingleBubbleDialogue();
    expect(reducers({}, action)).toEqual({ singleBubblePresentation: false });
  });

  it('choose option', () => {
    const action = chooseOption(0);
    expect(reducers({ timeline: [{ type: 'options'}] }, action)).toEqual({ timeline: [{ type: 'options', selected: 0 }] });
  });

  it('do not change state when choosing option but latest event is not options', () => {
    const action = chooseOption(0);
    expect(reducers({ timeline: [{ type: 'dialogue'}] }, action)).toEqual({ timeline: [{ type: 'dialogue' }] });
  });

  it('notify event', () => {
    const someObject = { some: 'object' };
    const action = notifyEvent(someObject);
    expect(reducers({ events: [] }, action)).toEqual({ events: [someObject] });
  });

  it('clear events', () => {
    const action = clearEvents();
    expect(reducers({ events: [1, 2 , 3] }, action)).toEqual({ events: [] });
  });
});


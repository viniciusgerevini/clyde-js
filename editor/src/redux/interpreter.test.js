import reducers, {
  setBlock,
  addDialogueLine,
  clearTimeline,
  showExtraMetadata,
  hideExtraMetadata,
  showDebugPane,
  hideDebugPane,
  setDebugPaneDirection,
  enableSingleBubbleDialogue,
  disableSingleBubbleDialogue,
  chooseOption,
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

  it('set debug pane direction', () => {
    const action = setDebugPaneDirection({ direction: 'horizontal' });
    expect(reducers({}, action)).toEqual({ debugPaneDirection: 'horizontal' });
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
});


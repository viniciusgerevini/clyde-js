import reducers, {
  toggleEditor,
  toggleInterpreter,
  changeInterpreterSplitDirection
} from './interface';

describe('Interface reducers', () => {
  it('toggle editor', () => {
    const action = toggleEditor({ state: false });
    const action2 = toggleEditor({ state: true });

    expect(reducers({}, action)).toEqual({ isEditorEnabled: false });
    expect(reducers({}, action2)).toEqual({ isEditorEnabled: true });
  });

  it('toggle interpreter', () => {
    const action = toggleInterpreter({ state: false });
    const action2 = toggleInterpreter({ state: true });

    expect(reducers({}, action)).toEqual({ isInterpreterEnabled: false });
    expect(reducers({}, action2)).toEqual({ isInterpreterEnabled: true });
  });

  it('change interpreter split direction', () => {
    const action = changeInterpreterSplitDirection({ direction: 'horizontal' });
    expect(reducers({}, action)).toEqual({ interpreterSplitDirection: 'horizontal' });
  });
});


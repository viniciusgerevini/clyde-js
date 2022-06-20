import reducers, {
  toggleEditor,
  toggleInterpreter,
  changeInterpreterSplitDirection,
  InterfaceState,
} from './interface';

describe('Interface reducers', () => {
  const fakeState = {} as InterfaceState;

  it('toggle editor', () => {
    const action = toggleEditor({ state: false });
    const action2 = toggleEditor({ state: true });

    expect(reducers(fakeState, action)).toEqual({ isEditorEnabled: false });
    expect(reducers(fakeState, action2)).toEqual({ isEditorEnabled: true });
  });

  it('toggle interpreter', () => {
    const action = toggleInterpreter({ state: false });
    const action2 = toggleInterpreter({ state: true });

    expect(reducers(fakeState, action)).toEqual({ isInterpreterEnabled: false });
    expect(reducers(fakeState, action2)).toEqual({ isInterpreterEnabled: true });
  });

  it('change interpreter split direction', () => {
    const action = changeInterpreterSplitDirection({ direction: 'horizontal' });
    expect(reducers(fakeState, action)).toEqual({ interpreterSplitDirection: 'horizontal' });
  });
});


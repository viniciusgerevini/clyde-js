import reducers, {
  setDocumentContent,
  updatePreference,
  EditorState,
} from './editor';

describe('Editor reducers', () => {
  const fakeState = {} as EditorState;
  it('sets document', () => {
    const action = setDocumentContent('content');
    expect(reducers(fakeState, action)).toEqual({ currentValue: 'content' });
  });

  it('updates preference', () => {
    const action = updatePreference({ name: 'fontSize', value: 3 });
    expect(reducers({ ...fakeState, preferences: { ...fakeState.preferences} }, action)).toEqual({ preferences: { fontSize: 3 } });
  });
});


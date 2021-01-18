import reducers, {
  setDocumentContent,
  updatePreference
} from './editor';

describe('Editor reducers', () => {
  it('sets document', () => {
    const action = setDocumentContent('content');
    expect(reducers({}, action)).toEqual({ currentValue: 'content' });
  });

  it('updates preference', () => {
    const action = updatePreference({ name: 'fontSize', value: 3 });
    expect(reducers({ preferences: {} }, action)).toEqual({ preferences: { fontSize: 3 } });
  });
});


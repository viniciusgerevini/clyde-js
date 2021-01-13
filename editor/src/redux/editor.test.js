import reducers, {
  setDocumentContent
} from './editor';

describe('Editor reducers', () => {
  it('sets document', () => {
    const action = setDocumentContent('content');
    expect(reducers({}, action)).toEqual({ currentValue: 'content' });
  });
});


import parse from './parser';

describe('parse', () => {
  it('parse empty document', () => {
    const result = parse('');
    const expected = {
      type: 'document',
      content: [],
      blocks: []
    };
    expect(result).toEqual(expected);
  });

  describe('error handling', () => {
    it('throws error when wrong parsing', () => {
      expect( () => parse(`$id id should be after text`)).toThrow(/Unexpected token ".*" on line 1 column 1. Expected .+/);
    });

    it('throws error when wrong parsing', () => {
      expect( () => parse(`speaker:`)).toThrow(/Unexpected token "EOF" on line 1 column 9. Expected .+/);
    });
  });
});

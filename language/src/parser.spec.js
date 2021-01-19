import parse from './parser';

describe('Parse', () => {
  it('parse empty document', () => {
    const result = parse('');
    const expected = {
      type: 'document',
      content: [],
      blocks: []
    };
    expect(result).toEqual(expected);
  });

  it('parse line', () => {
    const result = parse('jules: say what one more time! $first #yelling #mad');
    const expected = {
      type: 'document',
      content: [{
        type: 'content',
        content: [{
          type: 'line',
          text: 'say what one more time!',
          id: 'first',
          speaker: 'jules',
          tags: [
            'yelling',
            'mad'
          ]
        }]
      }],
      blocks: []
    };
    expect(result).toEqual(expected);
  });

  it('parse lines', () => {
    const result = parse(`
jules: say what one more time! $first #yelling #mad
just text
just id $another
just tags #tag
speaker: just speaker
id last #tag #another_tag $some_id
`);
    const expected = {
      type: 'document',
      content: [{
        type: 'content',
        content: [
          { type: 'line', text: 'say what one more time!', id: 'first', speaker: 'jules', tags: [ 'yelling', 'mad' ] },
          { type: 'line', text: 'just text' },
          { type: 'line', text: 'just id', id: 'another' },
          { type: 'line', text: 'just tags', tags: [ 'tag' ] },
          { type: 'line', text: 'just speaker', speaker: 'speaker' },
          { type: 'line', text: 'id last', id: 'some_id', tags: [ 'tag', 'another_tag' ] },
        ]
      }],
      blocks: []
    };
    expect(result).toEqual(expected);
  });

  it('throws error when wrong parsing', () => {
    expect( () => parse(`$id id should be after text`)).toThrow(/Unexpected token ".*" on line 0 column 0. Expected .+/);
  });
});

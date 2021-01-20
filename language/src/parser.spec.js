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

  describe('lines', () => {
    it('parse single line', () => {
      const result = parse('jules: say what one more time! $first #yelling #mad');
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [{
            type: 'line',
            value: 'say what one more time!',
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
            { type: 'line', value: 'say what one more time!', id: 'first', speaker: 'jules', tags: [ 'yelling', 'mad' ] },
            { type: 'line', value: 'just text' },
            { type: 'line', value: 'just id', id: 'another' },
            { type: 'line', value: 'just tags', tags: [ 'tag' ] },
            { type: 'line', value: 'just speaker', speaker: 'speaker' },
            { type: 'line', value: 'id last', id: 'some_id', tags: [ 'tag', 'another_tag' ] },
          ]
        }],
        blocks: []
      };
      expect(result).toEqual(expected);
    });


    it('parse multiline', () => {
      const result = parse(`
jules: say what one more time!
       Just say it $some_id #tag
hello! $id_on_first_line #and_tags
  Just talking.
`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            { type: 'line', value: 'say what one more time! Just say it', id: 'some_id', speaker: 'jules', tags: [ 'tag' ] },
            { type: 'line', value: 'hello! Just talking.', id: 'id_on_first_line', tags: [ 'and_tags' ] },
          ]
        }],
        blocks: []
      };
      expect(result).toEqual(expected);
    });

    it('parse text in quotes', () => {
      const result = parse(`
"jules: say what one more time!
       Just say it $some_id #tag"
"hello! $id_on_first_line #and_tags
  Just talking."

"this has $everything:" $id_on_first_line #and_tags
`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            { type: 'line', value: 'jules: say what one more time!\n       Just say it $some_id #tag' },
            { type: 'line', value: 'hello! $id_on_first_line #and_tags\n  Just talking.' },
            { type: 'line', value: 'this has $everything:', id: 'id_on_first_line', tags: [ 'and_tags' ] },
          ]
        }],
        blocks: []
      };
      expect(result).toEqual(expected);
    });
  });

  it('throws error when wrong parsing', () => {
    expect( () => parse(`$id id should be after text`)).toThrow(/Unexpected token ".*" on line 0 column 0. Expected .+/);
  });
});

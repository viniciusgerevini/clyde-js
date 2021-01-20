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

  describe('options', () => {

    it('parse options', () => {
      const result = parse(`
npc: what do you want to talk about?
* Life
  player: I want to talk about life!
  npc: Well! That's too complicated...
* Everything else... #some_tag
  player: What about everything else?
  npc: I don't have time for this...
`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            { type: 'line', value: 'what do you want to talk about?', speaker: 'npc', },
            {
              type: 'options',
              content: [
                {
                  type: 'option',
                  name: 'Life',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'Life' },
                      { type: 'line', value: 'I want to talk about life!', speaker: 'player', },
                      { type: 'line', value: 'Well! That\'s too complicated...', speaker: 'npc', },
                    ],
                  },
                },
                {
                  type: 'option',
                  name: 'Everything else...',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'Everything else...', tags: [ 'some_tag', ] },
                      { type: 'line', value: 'What about everything else?', speaker: 'player', },
                      { type: 'line', value: 'I don\'t have time for this...', speaker: 'npc', },
                    ],
                  },
                  tags: [ 'some_tag', ],
                },
              ],
            },
          ],
        },
        ],
        blocks: [],
      };
      expect(result).toEqual(expected);
    });

    it('parse sticky option', () => {
      const result = parse(`
npc: what do you want to talk about?
* Life
  player: I want to talk about life!
+ Everything else... #some_tag
  player: What about everything else?
`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            { type: 'line', value: 'what do you want to talk about?', speaker: 'npc', },
            {
              type: 'options',
              content: [
                {
                  type: 'option',
                  name: 'Life',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'Life' },
                      { type: 'line', value: 'I want to talk about life!', speaker: 'player', },
                    ],
                  },
                },
                {
                  type: 'option',
                  name: 'Everything else...',
                  mode: 'sticky',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'Everything else...', tags: [ 'some_tag', ] },
                      { type: 'line', value: 'What about everything else?', speaker: 'player', },
                    ],
                  },
                  tags: [ 'some_tag', ],
                },
              ],
            },
          ],
        },
        ],
        blocks: [],
      };
      expect(result).toEqual(expected);
    });

    it('define label only text', () => {
      const result = parse(`
npc: what do you want to talk about?
* [Life]
  player: I want to talk about life!
  npc: Well! That's too complicated...
* [Everything else... #some_tag]
  player: What about everything else?
  npc: I don't have time for this...
`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            { type: 'line', value: 'what do you want to talk about?', speaker: 'npc', },
            {
              type: 'options',
              content: [
                {
                  type: 'option',
                  name: 'Life',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'I want to talk about life!', speaker: 'player', },
                      { type: 'line', value: 'Well! That\'s too complicated...', speaker: 'npc', },
                    ],
                  },
                },
                {
                  type: 'option',
                  name: 'Everything else...',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'What about everything else?', speaker: 'player', },
                      { type: 'line', value: 'I don\'t have time for this...', speaker: 'npc', },
                    ],
                  },
                  tags: [ 'some_tag', ],
                },
              ],
            },
          ],
        },
        ],
        blocks: [],
      };
      expect(result).toEqual(expected);
    });

    it('use first line as label', () => {
      const result = parse(`
*
  life
  player: I want to talk about life!
  npc: Well! That's too complicated...

`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            {
              type: 'options',
              content: [
                {
                  type: 'option',
                  name: 'life',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'life' },
                      { type: 'line', value: 'I want to talk about life!', speaker: 'player', },
                      { type: 'line', value: 'Well! That\'s too complicated...', speaker: 'npc', },
                    ],
                  },
                },
              ],
            },
          ],
        },
        ],
        blocks: [],
      };
      expect(result).toEqual(expected);
    });

    it('use previous line as label', () => {
      const result = parse(`
spk: this line will be the label $some_id #some_tag
  * life
    player: I want to talk about life!
    npc: Well! That's too complicated...

spk: second try
  * life
    npc: Well! That's too complicated...
`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            {
              type: 'options',
              speaker: 'spk',
              id: 'some_id',
              tags: ['some_tag'],
              name: 'this line will be the label',
              content: [
                {
                  type: 'option',
                  name: 'life',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'life' },
                      { type: 'line', value: 'I want to talk about life!', speaker: 'player', },
                      { type: 'line', value: 'Well! That\'s too complicated...', speaker: 'npc', },
                    ],
                  },
                },
              ],
            },
            {
              type: 'options',
              speaker: 'spk',
              name: 'second try',
              content: [
                {
                  type: 'option',
                  name: 'life',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'life' },
                      { type: 'line', value: 'Well! That\'s too complicated...', speaker: 'npc', },
                    ],
                  },
                },
              ],
            },
          ],
        },
        ],
        blocks: [],
      };
      expect(result).toEqual(expected);
    });

    it('use previous line in quotes as label', () => {
      const result = parse(`
"spk: this line will be the label $some_id #some_tag"
  * life
    player: I want to talk about life!


"spk: this line will be the label $some_id #some_tag"
  * universe
    player: I want to talk about the universe!
`);
      const expected = {
        type: 'document',
        content: [{
          type: 'content',
          content: [
            {
              type: 'options',
              name: 'spk: this line will be the label $some_id #some_tag',
              content: [
                {
                  type: 'option',
                  name: 'life',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'life' },
                      { type: 'line', value: 'I want to talk about life!', speaker: 'player', },
                    ],
                  },
                },
              ],
            },
            {
              type: 'options',
              name: 'spk: this line will be the label $some_id #some_tag',
              content: [
                {
                  type: 'option',
                  name: 'universe',
                  mode: 'once',
                  content: {
                    type: 'content',
                    content: [
                      { type: 'line', value: 'universe' },
                      { type: 'line', value: 'I want to talk about the universe!', speaker: 'player', },
                    ],
                  },
                },
              ],
            },
          ],
        },
        ],
        blocks: [],
      };
      expect(result).toEqual(expected);
    });
  });

  describe('error handling', () => {
    it('throws error when wrong parsing', () => {
      expect( () => parse(`$id id should be after text`)).toThrow(/Unexpected token ".*" on line 0 column 0. Expected .+/);
    });

    it('throws error when wrong parsing', () => {
      expect( () => parse(`speaker:`)).toThrow(/Unexpected token "EOF" on line 0 column 8. Expected .+/);
    });
  });
});

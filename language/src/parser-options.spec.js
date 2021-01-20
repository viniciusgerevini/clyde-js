import parse from './parser';

describe('parse: options', () => {

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

import parse from './parser';

describe('parse: options', () => {

  it('parse options', () => {
    const result = parse(`
npc: what do you want to talk about?
* speaker: Life
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
                speaker: 'speaker',
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

  it('parse fallback option', () => {
    const result = parse(`
npc: what do you want to talk about?
* Life
  player: I want to talk about life!
> Everything else... #some_tag
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
                    { type: 'line', value: 'I want to talk about life!', speaker: 'player', },
                  ],
                },
              },
              {
                type: 'option',
                name: 'Everything else...',
                mode: 'fallback',
                content: {
                  type: 'content',
                  content: [
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


  it('define label to display as content', () => {
    const result = parse(`
npc: what do you want to talk about?
*= Life
  player: I want to talk about life!
  npc: Well! That's too complicated...
*= Everything else... #some_tag
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
                    { type: 'line', value: 'Everything else...', tags: ['some_tag'], },
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


  it('ensures options ending worked', () => {
    const result = parse(`
*= yes
*= no

{ some_check } maybe
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
                name: 'yes',
                mode: 'once',
                content: {
                  type: 'content',
                  content: [
                    { type: 'line', value: 'yes' },
                  ],
                },
              },
              {
                type: 'option',
                name: 'no',
                mode: 'once',
                content: {
                  type: 'content',
                  content: [
                    { type: 'line', value: 'no' },
                  ],
                },
              },
            ],
          },
          {
            type: "conditional_content",
            conditions: { type: "variable", name: "some_check" },
            content: { type: "line", value: "maybe", }
          },
        ],
      },
      ],
      blocks: [],
    };
    expect(result).toEqual(expected);
  });

  it('ensures option item ending worked', () => {
    const result = parse(`
*= yes { set yes = true }
* no
  no
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
                type: "action_content",
                action: {
                  type: 'assignments',
                  assignments: [
                    {
                      type: 'assignment',
                      variable: { type: 'variable', name: 'yes', },
                      operation: 'assign',
                      value: { type: 'literal', name: 'boolean', value: true, },
                    },
                  ],
                },
                content: {
                  type: 'option',
                  name: 'yes',
                  mode: 'once',
                  content: { type: 'content', content: [{ type: 'line', value: 'yes' }]},
                },
              },
              {
                type: 'option',
                name: 'no',
                mode: 'once',
                content: { type: 'content', content: [ { type: 'line', value: 'no' }, ]},
              },
            ],
          },
        ],
      }],
      blocks: [],
    };
    expect(result).toEqual(expected);
  });

  it('options with blocks both sides', () => {
    const result = parse(`
*= { what } yes { set yes = true }
* {set no = true} no { when something }
  no
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
               type: "conditional_content",
               conditions: { type: "variable", name: "what" },
               content: {
                  type: "action_content",
                  action: {
                    type: 'assignments',
                    assignments: [
                      {
                        type: 'assignment',
                        variable: { type: 'variable', name: 'yes', },
                        operation: 'assign',
                        value: { type: 'literal', name: 'boolean', value: true, },
                      },
                    ],
                  },
                  content: {
                    type: 'option',
                    name: 'yes',
                    mode: 'once',
                    content: { type: 'content', content: [{ type: 'line', value: 'yes' }]},
                  },
                },
             },

              {
                type: "action_content",
                action: {
                  type: 'assignments',
                  assignments: [
                    {
                      type: 'assignment',
                      variable: { type: 'variable', name: 'no', },
                      operation: 'assign',
                      value: { type: 'literal', name: 'boolean', value: true, },
                    },
                  ],
                },
                content: {
                  type: "conditional_content",
                  conditions: { type: "variable", name: "something" },
                  content: {
                    type: 'option',
                    name: 'no',
                    mode: 'once',
                    content: { type: 'content', content: [ { type: 'line', value: 'no' }, ]},
                  },
                },
              },
            ],
          },
        ],
      }],
      blocks: [],
    };
    expect(result).toEqual(expected);
  });


  it('options with multiple blocks on same side', () => {
    const result = parse(`
*= yes { when what } { set yes = true }
*= no {set no = true} { when something }
*= { when what } { set yes = true } yes
*= {set no = true} { when something } no
*= {set yes = true} { when yes } yes { set one_more = true }
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
                type: "conditional_content",
                conditions: { type: "variable", name: "what" },
                content: {
                  type: "action_content",
                  action: {
                    type: 'assignments',
                    assignments: [
                      {
                        type: 'assignment',
                        variable: { type: 'variable', name: 'yes', },
                        operation: 'assign',
                        value: { type: 'literal', name: 'boolean', value: true, },
                      },
                    ],
                  },
                  content: {
                    type: 'option',
                    name: 'yes',
                    mode: 'once',
                    content: { type: 'content', content: [{ type: 'line', value: 'yes' }]},
                  },
                },
              },

              {
                type: "action_content",
                action: {
                  type: 'assignments',
                  assignments: [
                    {
                      type: 'assignment',
                      variable: { type: 'variable', name: 'no', },
                      operation: 'assign',
                      value: { type: 'literal', name: 'boolean', value: true, },
                    },
                  ],
                },
                content: {
                  type: "conditional_content",
                  conditions: { type: "variable", name: "something" },
                  content: {
                    type: 'option',
                    name: 'no',
                    mode: 'once',
                    content: { type: 'content', content: [ { type: 'line', value: 'no' }, ]},
                  },
                },
              },

              {
                type: "conditional_content",
                conditions: { type: "variable", name: "what" },
                content: {
                  type: "action_content",
                  action: {
                    type: 'assignments',
                    assignments: [
                      {
                        type: 'assignment',
                        variable: { type: 'variable', name: 'yes', },
                        operation: 'assign',
                        value: { type: 'literal', name: 'boolean', value: true, },
                      },
                    ],
                  },
                  content: {
                    type: 'option',
                    name: 'yes',
                    mode: 'once',
                    content: { type: 'content', content: [{ type: 'line', value: 'yes' }]},
                  },
                },
              },

              {
                type: "action_content",
                action: {
                  type: 'assignments',
                  assignments: [
                    {
                      type: 'assignment',
                      variable: { type: 'variable', name: 'no', },
                      operation: 'assign',
                      value: { type: 'literal', name: 'boolean', value: true, },
                    },
                  ],
                },
                content: {
                  type: "conditional_content",
                  conditions: { type: "variable", name: "something" },
                  content: {
                    type: 'option',
                    name: 'no',
                    mode: 'once',
                    content: { type: 'content', content: [ { type: 'line', value: 'no' }, ]},
                  },
                },
              },

              {
                type: "action_content",
                action: {
                  type: 'assignments',
                  assignments: [
                    {
                      type: 'assignment',
                      variable: { type: 'variable', name: 'yes', },
                      operation: 'assign',
                      value: { type: 'literal', name: 'boolean', value: true, },
                    },
                  ],
                },
                content: {
                  type: "conditional_content",
                  conditions: { type: "variable", name: "yes" },
                  content: {
                    type: "action_content",
                    action: {
                      type: 'assignments',
                      assignments: [
                        {
                          type: 'assignment',
                          variable: { type: 'variable', name: 'one_more', },
                          operation: 'assign',
                          value: { type: 'literal', name: 'boolean', value: true, },
                        },
                      ],
                    },
                    content: {
                      type: 'option',
                      name: 'yes',
                      mode: 'once',
                      content: { type: 'content', content: [ { type: 'line', value: 'yes' }, ]},
                    },
                  },
                },
              },
            ],
          },
        ],
      }],
      blocks: [],
    };
    expect(result).toEqual(expected);
  });
});

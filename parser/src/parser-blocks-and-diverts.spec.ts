import parse from './parser';

describe('parse', () => {
  it('parse blocks', () => {
    const result = parse(`
== first block
line 1
line 2

== second_block
line 3
line 4

`);
    const expected = {
      type: 'document',
      content: [],
      blocks: [
        { type: 'block', name: 'first block', content: {
          type: 'content',
          content: [
            { type: 'line', value: 'line 1' },
            { type: 'line', value: 'line 2' },
          ]
        }},
        { type: 'block', name: 'second_block', content: {
          type: 'content',
          content: [
            { type: 'line', value: 'line 3' },
            { type: 'line', value: 'line 4' },
          ]
        }},
      ]
    };
    expect(result).toEqual(expected);
  });

  it('parse blocks and lines', () => {
    const result = parse(`
line outside block 1
line outside block 2

== first block
line 1
line 2

== second_block
line 3
line 4

`);
    const expected = {
      type: 'document',
      content: [{
        type: 'content',
        content: [
          { type: 'line', value: 'line outside block 1' },
          { type: 'line', value: 'line outside block 2' },
        ]
      }],
      blocks: [
        { type: 'block', name: 'first block', content: {
          type: 'content',
          content: [
            { type: 'line', value: 'line 1' },
            { type: 'line', value: 'line 2' },
          ]
        }},
        { type: 'block', name: 'second_block', content: {
          type: 'content',
          content: [
            { type: 'line', value: 'line 3' },
            { type: 'line', value: 'line 4' },
          ]
        }},
      ]
    };
    expect(result).toEqual(expected);
  });

  it('parse diverts', () => {
    const result = parse(`
-> one
-> END
<-
* thats it
  -> somewhere
  <-
* does it work this way?
  -> go
`);
    const expected = {
      type: 'document',
      content: [{
        type: 'content',
        content: [
          { type: 'divert', target: 'one' },
          { type: 'divert', target: '<end>' },
          { type: 'divert', target: '<parent>' },
          { type: 'options', content: [
              { type: 'option', name: 'thats it', mode: 'once', content: {
                  type: 'content',
                  content: [
                    { type: 'divert', target: 'somewhere' },
                    { type: 'divert', target: '<parent>' },
                  ],
              }},
              { type: 'option', name: 'does it work this way?', mode: 'once', content: {
                  type: 'content',
                  content: [
                    { type: 'divert', target: 'go' },
                  ],
              }},
          ]},
        ]
      }],
      blocks: []
    };
    expect(result).toEqual(expected);
  });


  it('parse empty block', () => {
    const result = parse(`
== first block
`);
    const expected = {
      type: 'document',
      content: [],
      blocks: [
        { type: 'block', name: 'first block', content: {
          type: 'content',
          content: []
        }},
      ]
    };
    expect(result).toEqual(expected);
  });
});

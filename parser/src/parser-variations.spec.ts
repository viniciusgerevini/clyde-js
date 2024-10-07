import parse from './parser';

describe('variations', () => {
  it('simple variations', () => {
    const result = parse(`
(
  - yes
  - no
)
`);

    const expected = {
      type: 'document',
      blocks: [],
      links: {},
      content: [{
        type: 'content',
        content: [
          { type: 'variations', mode: 'cycle', content: [
              { type: 'content', content: [ { type: 'line', value: 'yes' }, ], },
              { type: 'content', content: [ { type: 'line', value: 'no' }, ], },
          ],},
        ],
      },
      ],
    };

    expect(result).toEqual(expected);
  });

  it('simple variations with no indentation', () => {
    const result = parse(`
(
- yes
- no
)
`);

    const expected = {
      type: 'document',
      blocks: [],
      links: {},
      content: [{
        type: 'content',
        content: [
          { type: 'variations', mode: 'cycle', content: [
              { type: 'content', content: [ { type: 'line', value: 'yes' }, ], },
              { type: 'content', content: [ { type: 'line', value: 'no' }, ], },
          ],},
        ],
      },
      ],
    };

    expect(result).toEqual(expected);
  });

  it('nested variations', () => {
    const result = parse(`
(
  - yes
  - no
  - (
    - nested 1
  )
)
`);

    const expected = {
      type: 'document',
      blocks: [],
      links: {},
      content: [{
        type: 'content',
        content: [
          { type: 'variations', mode: 'cycle', content: [
              { type: 'content', content: [ { type: 'line', value: 'yes' }, ], },
              { type: 'content', content: [ { type: 'line', value: 'no' }, ], },
              { type: 'content', content: [
                { type: 'variations', mode: 'cycle', content: [
                    { type: 'content', content: [ { type: 'line', value: 'nested 1' }, ], },
                ],},
              ], },
          ],},
        ],
      },
      ],
    };

    expect(result).toEqual(expected);
  });

  test.each(['shuffle', 'shuffle once', 'shuffle cycle', 'shuffle sequence', 'sequence', 'once', 'cycle'])('variations with mode %s', (mode) => {
    const result = parse(`
( ${mode}
  - yes
  - no
)
`);

    const expected = {
      type: 'document',
      blocks: [],
      links: {},
      content: [{
        type: 'content',
        content: [
          { type: 'variations', mode: mode, content: [
              { type: 'content', content: [ { type: 'line', value: 'yes' }, ], },
              { type: 'content', content: [ { type: 'line', value: 'no' }, ], },
          ],},
        ],
      },
      ],
    };

    expect(result).toEqual(expected);
  });

  it('do not accept variations with unkown mode', () => {
    const content = `
( sffle
  - yes
  - no
)
`;
    expect( () => parse(content)).toThrow(/Wrong variation mode set "sffle". Valid modes: sequence, once, cycle, shuffle, shuffle sequence, shuffle once, shuffle cycle./);
  });

  it('variations with options', () => {
    const result = parse(`
(
  - *= works?
    yes
  * yep?
    yes
  - nice
  -
    *= works?
      yes
    * yep?
      yes
)
`);

    const expected = {
      type: 'document',
      blocks: [],
      links: {},
      content: [{
        type: 'content',
        content: [
          { type: 'variations', mode: 'cycle', content: [
            { type: 'content', content: [
              { type: 'options', content: [
                { type: 'option', name: 'works?', mode: 'once', content: {
                    type: 'content', content: [ { type: 'line', value: 'works?' }, { type: 'line', value: 'yes' }, ],
                  },
                },
                { type: 'option', name: 'yep?', mode: 'once', content: { type: 'content', content: [ { type: 'line', value: 'yes' }, ], }, },
              ]},
            ], },
            { type: 'content', content: [ { type: 'line', value: 'nice' }, ], },
            { type: 'content', content: [
              { type: 'options', content: [
                { type: 'option', name: 'works?', mode: 'once', content: {
                    type: 'content', content: [ { type: 'line', value: 'works?' }, { type: 'line', value: 'yes' }, ],
                  },
                },
                { type: 'option', name: 'yep?', mode: 'once', content: { type: 'content', content: [ { type: 'line', value: 'yes' }, ], }, },
              ]},
            ], },
          ],},
        ],
      },
      ],
    };

    expect(result).toEqual(expected);
  });
});


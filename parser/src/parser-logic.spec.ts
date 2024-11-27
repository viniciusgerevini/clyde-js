import parse from './parser';

describe('parse: logic', () => {
  const createDocPayload = (content: Array<any> = [], blocks = []) => {
    return {
      type: 'document',
      content: [{
        type: "content",
        content
      }],
      blocks,
      links: {},
    };
  };

  describe('conditions', () => {
    it('single var', () => {
      const result = parse(`{ some_var } This is conditional`);
      const expected = createDocPayload([
        {
          type: "conditional_content",
          conditions: { type: "variable", name: "some_var" },
          content: { type: "line", value: "This is conditional", }
        },
      ]);
      expect(result).toEqual(expected);
    });

    it('condition with multiline dialogue', () => {
      const result = parse(`{ another_var } This is conditional
    multiline`);

      const expected = createDocPayload([{
        type: "conditional_content",
        conditions: { type: "variable", name: "another_var" },
        content: { type: "line", value: "This is conditional multiline", }
      }]);
      expect(result).toEqual(expected);
    });

    it('"not" operator', () => {
      const result = parse(`{ not some_var } This is conditional`);

      const expected = createDocPayload([
                {
                  type: "conditional_content",
                  conditions: {
                    type: "expression",
                    name: "not",
                    elements: [{ type: "variable", name: "some_var" }]
                  },
                  content: { type: "line", value: "This is conditional", }
                }
      ]);
      expect(result).toEqual(expected);
    });


    it('"and" operator', () => {
      const result = parse(`{ first_time && second_time } npc: what do you want to talk about? `);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'and',
            elements: [
              { type: 'variable', name: 'first_time', },
              { type: 'variable', name: 'second_time', },
            ],
          },
          content: { type: 'line', value: 'what do you want to talk about?', speaker: 'npc', },
        }
      ]);
      expect(result).toEqual(expected);
    });

    it('multiple logical checks: "and" and "or"', () => {
      const result = parse(`{ first_time and second_time or third_time } npc: what do you want to talk about? `);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'or',
            elements: [
              {
                type: 'expression',
                name: 'and',
                elements: [
                  { type: 'variable', name: 'first_time', },
                  { type: 'variable', name: 'second_time', },
                ],
              },
              { type: 'variable', name: 'third_time', },
            ],
          },
          content: { type: 'line', value: 'what do you want to talk about?', speaker: 'npc', },
        }
      ]);
      expect(result).toEqual(expected);
    });

    it('multiple equality check', () => {
      const result = parse(`{ first_time == second_time or third_time != fourth_time } equality`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'or',
            elements: [
              {
                type: 'expression',
                name: 'equal',
                elements: [
                  { type: 'variable', name: 'first_time', },
                  { type: 'variable', name: 'second_time', },
                ],
              },
              {
                type: 'expression',
                name: 'not_equal',
                elements: [
                  { type: 'variable', name: 'third_time', },
                  { type: 'variable', name: 'fourth_time', },
                ],
              },
            ],
          },
          content: { type: 'line', value: 'equality', },
        }
      ]);
      expect(result).toEqual(expected);
    });


    it('multiple alias equality check', () => {
      const result = parse(`{ first_time is second_time or third_time isnt fourth_time } alias equality`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'or',
            elements: [
              {
                type: 'expression',
                name: 'equal',
                elements: [
                  { type: 'variable', name: 'first_time', },
                  { type: 'variable', name: 'second_time', },
                ],
              },
              {
                type: 'expression',
                name: 'not_equal',
                elements: [
                  { type: 'variable', name: 'third_time', },
                  { type: 'variable', name: 'fourth_time', },
                ],
              },
            ],
          },
          content: { type: 'line', value: 'alias equality', },
        }
      ]);
      expect(result).toEqual(expected);
    });


    it('less or greater', () => {
      const result = parse(`{ first_time < second_time or third_time > fourth_time } comparison`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'or',
            elements: [
              {
                type: 'expression',
                name: 'less_than',
                elements: [
                  { type: 'variable', name: 'first_time', },
                  { type: 'variable', name: 'second_time', },
                ],
              },
              {
                type: 'expression',
                name: 'greater_than',
                elements: [
                  { type: 'variable', name: 'third_time', },
                  { type: 'variable', name: 'fourth_time', },
                ],
              },
            ],
          },
          content: { type: 'line', value: 'comparison', },
        },
      ]);
      expect(result).toEqual(expected);
    });

    it('less or equal and greater or equal', () => {
      const result = parse(`{ first_time <= second_time and third_time >= fourth_time } second comparison`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'and',
            elements: [
              {
                type: 'expression',
                name: 'less_or_equal',
                elements: [
                  { type: 'variable', name: 'first_time', },
                  { type: 'variable', name: 'second_time', },
                ],
              },
              {
                type: 'expression',
                name: 'greater_or_equal',
                elements: [
                  { type: 'variable', name: 'third_time', },
                  { type: 'variable', name: 'fourth_time', },
                ],
              },
            ],
          },
          content: { type: 'line', value: 'second comparison', },
        }
      ]);
      expect(result).toEqual(expected);
    });


    it('complex precendence case', () => {
      const result = parse(`{ first_time > x + y - z * d / e % b } test`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'greater_than',
            elements: [
              { type: 'variable', name: 'first_time', },
              {
                type: 'expression',
                name: 'sub',
                elements: [
                  {
                    type: 'expression',
                    name: 'add',
                    elements: [
                      { type: 'variable', name: 'x', },
                      { type: 'variable', name: 'y', },
                    ],
                  },
                  {
                    type: 'expression',
                    name: 'mod',
                    elements: [
                      {
                        type: 'expression',
                        name: 'div',
                        elements: [
                          {
                            type: 'expression',
                            name: 'mult',
                            elements: [
                              { type: 'variable', name: 'z', },
                              { type: 'variable', name: 'd', },
                            ],
                          },
                          { type: 'variable', name: 'e', },
                        ],
                      },
                      { type: 'variable', name: 'b', },
                    ],
                  },
                ],
              },
            ],
          },
          content: { type: 'line', value: 'test', },
        },
      ]);
      expect(result).toEqual(expected);
    });


    it('number literal', () => {
      const result = parse(`{ first_time > 0 } hey`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'greater_than',
            elements: [
              { type: 'variable', name: 'first_time', },
              { type: 'literal', name: 'number', value: 0, },
            ],
          },
          content: { type: 'line', value: 'hey', },
        },
      ]);
      expect(result).toEqual(expected);
    });


    it('null token', () => {
      const result = parse(`{ first_time != null } ho`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'not_equal',
            elements: [
              { type: 'variable', name: 'first_time', },
              { type: 'null', },
            ],
          },
          content: { type: 'line', value: 'ho', },
        }
      ]);
      expect(result).toEqual(expected);
    });


    it('boolean literal', () => {
      const result = parse(`{ first_time is false } let's go`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'equal',
            elements: [
              { type: 'variable', name: 'first_time', },
              { type: 'literal', name: 'boolean', value: false, },
            ],
          },
          content: { type: 'line', value: 'let\'s go', },
        }
      ]);
      expect(result).toEqual(expected);
    });

    it('string literal', () => {
      const result = parse(`{ first_time is "hello darkness >= my old friend" } let's go`);

      const expected = createDocPayload([
        {
          type: 'conditional_content',
          conditions: {
            type: 'expression',
            name: 'equal',
            elements: [
              { type: 'variable', name: 'first_time', },
              { type: 'literal', name: 'string', value: 'hello darkness >= my old friend', },
            ],
          },
          content: { type: 'line', value: 'let\'s go', },
        }
      ]);
      expect(result).toEqual(expected);
    });

    it('condition before line with keyword', () => {
      const result = parse(`{ when some_var } This is conditional`);
      const expected = createDocPayload([
        {
          type: "conditional_content",
          conditions: { type: "variable", name: "some_var" },
          content: { type: "line", value: "This is conditional", }
        },
      ]);
      expect(result).toEqual(expected);
    });

    it('condition after line', () => {
      const result = parse(`This is conditional { when some_var }`);
      const expected = createDocPayload([
        {
          type: "conditional_content",
          conditions: { type: "variable", name: "some_var" },
          content: { type: "line", value: "This is conditional", }
        },
      ]);
      expect(result).toEqual(expected);
    });

    it('condition after line without when', () => {
      const result = parse(`This is conditional { some_var }`);
      const expected = createDocPayload([
        {
          type: "conditional_content",
          conditions: { type: "variable", name: "some_var" },
          content: { type: "line", value: "This is conditional", }
        },
      ]);
      expect(result).toEqual(expected);
    });

    describe('conditional divert', () => {
      it('before divert', () => {
        const result = parse(`{ some_var } -> some_block`);
        const expected = createDocPayload([
          {
            type: "conditional_content",
            conditions: { type: "variable", name: "some_var" },
            content: { type: "divert", target: "some_block", }
          },
        ]);
        expect(result).toEqual(expected);
      });

      it('after divert', () => {
        const result = parse(`-> some_block { some_var }`);
        const expected = createDocPayload([
          {
            type: "conditional_content",
            conditions: { type: "variable", name: "some_var" },
            content: { type: "divert", target: "some_block", }
          },
        ]);
        expect(result).toEqual(expected);
      });
    });

    it('conditional option', () => {
      const result = parse(`
*= { some_var } option 1
*= option 2 { when some_var }
*= { some_other_var } option 3
`);
      const expected = createDocPayload([{
        type: 'options',
        content: [
          {
            type: "conditional_content",
            conditions: { type: "variable", name: "some_var" },
            content: {
              type: 'option',
              name: 'option 1',
              mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 1' },
                ],
              },
            },
          },
          {
            type: "conditional_content",
            conditions: { type: "variable", name: "some_var" },
            content: {
              type: 'option',
              name: 'option 2',
              mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 2' },
                ],
              },
            },
          },
          {
            type: "conditional_content",
            conditions: { type: "variable", name: "some_other_var" },
            content: {
              type: 'option',
              name: 'option 3',
              mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 3' },
                ],
              },
            },
          },
        ],
          }
      ]);
      expect(result).toEqual(expected);
    });

    it('conditional indented block', () => {
      const result = parse(`
{ some_var }
      This is conditional
      This is second conditional
      This is third conditional
`);
      const expected = createDocPayload([
        {
          type: "conditional_content",
          conditions: { type: "variable", name: "some_var" },
          content: {
            type: 'content',
            content: [
              { type: "line", value: "This is conditional", },
              { type: "line", value: "This is second conditional", },
              { type: "line", value: "This is third conditional", }
            ]
          }
        },
      ]);
      expect(result).toEqual(expected);
    });
  });

  describe('assignments', () => {
    const assignments = [
      [ '=', 'assign'],
      [ '+=', 'assign_sum'],
      [ '-=', 'assign_sub'],
      [ '*=', 'assign_mult'],
      [ '/=', 'assign_div'],
      [ '%=', 'assign_mod'],
      [ '^=', 'assign_pow'],
    ];

    test.each(assignments)('set variable with %p', (token, nodeName) => {
      const result = parse(`{ set a ${token} 2 } let's go`);
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: { type: 'variable', name: 'a', },
              operation: nodeName,
              value: { type: 'literal', name: 'number', value: 2, },
            },
          ],
        },
        content: { type: 'line', value: 'let\'s go', },
      }]);
      expect(result).toEqual(expected);
    });

    it('assignment with expression', () => {
      const result = parse('{ set a -= 4 ^ 2 } let\'s go');
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: {
                type: 'variable',
                name: 'a',
              },
              operation: 'assign_sub',
              value: {
                type: 'expression',
                name: 'pow',
                elements: [
                  {
                    type: 'literal',
                    name: 'number',
                    value: 4,
                  },
                  {
                    type: 'literal',
                    name: 'number',
                    value: 2,
                  },
                ],
              },
            },
          ],
        },
        content: { type: 'line', value: 'let\'s go', },
      }]);
      expect(result).toEqual(expected);
    });

    it('assignment with expression', () => {
      const result = parse('multiply { set a = a * 2 }');
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: {
                type: 'variable',
                name: 'a',
              },
              operation: 'assign',
              value: {
                type: 'expression',
                name: 'mult',
                elements: [
                  {
                    type: 'variable',
                    name: 'a',
                  },
                  {
                    type: 'literal',
                    name: 'number',
                    value: 2,
                  },
                ],
              },
            },
          ],
        },
        content: { type: 'line', value: 'multiply', },
      }]);
      expect(result).toEqual(expected);
    });

    it('chaining assigments', () => {
      const result = parse('{ set a = b = c = d = 3 } let\'s go');
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: {
                type: 'variable',
                name: 'a',
              },
              operation: 'assign',
              value: {
                type: 'assignment',
                variable: {
                  type: 'variable',
                  name: 'b',
                },
                operation: 'assign',
                value: {
                  type: 'assignment',
                  variable: {
                    type: 'variable',
                    name: 'c',
                  },
                  operation: 'assign',
                  value: {
                    type: 'assignment',
                    variable: {
                      type: 'variable',
                      name: 'd',
                    },
                    operation: 'assign',
                    value: {
                      type: 'literal',
                      name: 'number',
                      value: 3,
                    },
                  },
                },
              },
            },
          ],
        },
        content: { type: 'line', value: 'let\'s go', },
      }]);
      expect(result).toEqual(expected);
    });

  it('chaining assigment ending with variable', () => {
      const result = parse('{ set a = b = c } let\'s go');
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: {
                type: 'variable',
                name: 'a',
              },
              operation: 'assign',
              value: {
                type: 'assignment',
                variable: {
                  type: 'variable',
                  name: 'b',
                },
                operation: 'assign',
                value: {
                  type: 'variable',
                  name: 'c',
                },
              },
            },
          ],
        },
        content: { type: 'line', value: 'let\'s go', },
      }]);
      expect(result).toEqual(expected);
    });

    it('multiple assigments block', () => {
      const result = parse('{ set a -= 4, b=1, c = "hello" } hey you');
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: {
                type: 'variable',
                name: 'a',
              },
              operation: 'assign_sub',
              value: {
                type: 'literal',
                name: 'number',
                value: 4,
              },
            },
            {
              type: 'assignment',
              variable: {
                type: 'variable',
                name: 'b',
              },
              operation: 'assign',
              value: {
                type: 'literal',
                name: 'number',
                value: 1,
              },
            },
            {
              type: 'assignment',
              variable: {
                type: 'variable',
                name: 'c',
              },
              operation: 'assign',
              value: {
                type: 'literal',
                name: 'string',
                value: 'hello',
              },
            },
          ],
        },
        content: { type: 'line', value: 'hey you' },
      }]);
      expect(result).toEqual(expected);
    });

    it('assignment after line', () => {
      const result = parse(`let's go { set a = 2 }`);
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: { type: 'variable', name: 'a', },
              operation: 'assign',
              value: { type: 'literal', name: 'number', value: 2, },
            },
          ],
        },
        content: { type: 'line', value: 'let\'s go', },
      }]);
      expect(result).toEqual(expected);
    });

    it('standalone assignment', () => {
      const result = parse(`
{ set a = 2 }
{ set b = 3 }`);

      const expected = createDocPayload([
        {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: { type: 'variable', name: 'a', },
              operation: 'assign',
              value: { type: 'literal', name: 'number', value: 2, },
            },
          ],
        },
        {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: { type: 'variable', name: 'b', },
              operation: 'assign',
              value: { type: 'literal', name: 'number', value: 3, },
            },
          ],
        }
      ]);
      expect(result).toEqual(expected);
    });

    it('options assignment', () => {
      const result = parse(`
*= { set a = 2 } option 1
*= option 2 { set b = 3 }
*= { set c = 4 } option 3
`);
      const expected = createDocPayload([{
        type: 'options',
        content: [
          {
            type: "action_content",
            action: {
              type: 'assignments',
              assignments: [{ type: 'assignment', variable: { type: 'variable', name: 'a', }, operation: 'assign', value: { type: 'literal', name: 'number', value: 2, }, }, ],
            },
            content: { type: 'option', name: 'option 1', mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 1' },
                ],
              },
            },
          },
          {
            type: "action_content",
            action: {
              type: 'assignments',
              assignments: [{ type: 'assignment', variable: { type: 'variable', name: 'b', }, operation: 'assign', value: { type: 'literal', name: 'number', value: 3, }, }, ],
            },
            content: { type: 'option', name: 'option 2', mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 2' },
                ],
              },
            },
          },
          {
            type: "action_content",
            action: {
              type: 'assignments',
              assignments: [{ type: 'assignment', variable: { type: 'variable', name: 'c', }, operation: 'assign', value: { type: 'literal', name: 'number', value: 4, }, }, ],
            },
            content: { type: 'option', name: 'option 3', mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 3' },
                ],
              },
            },
          },
        ],
        }
      ]);
      expect(result).toEqual(expected);
    });

    it('divert with assignment', () => {
      const result = parse(`-> go { set a = 2 }`);
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: { type: 'variable', name: 'a', },
              operation: 'assign',
              value: { type: 'literal', name: 'number', value: 2, },
            },
          ],
        },
        content: { type: 'divert', target: 'go', },
      }]);
      expect(result).toEqual(expected);
    });

    it('assign True boolean when standalone variable', () => {
      const result = parse('{ set a }');
      const expected = createDocPayload([
        {
          type: 'assignments',
          assignments: [
            {
              type: 'assignment',
              variable: { type: 'variable', name: 'a', },
              operation: 'assign',
              value: { type: 'literal', name: 'boolean', value: true, },
            },
          ],
        },
      ]);
      expect(result).toEqual(expected);
    });
  });

  describe('events', () => {
    it('trigger event', () => {
      const result = parse(`{ trigger some_event } trigger`);
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'events',
          events: [{ type: 'event', name: 'some_event' }],
        },
        content: {
          type: 'line',
          value: 'trigger',
        },
      }]);
      expect(result).toEqual(expected);
    });

    it('trigger event with parameters', () => {
      const result = parse(`{ trigger some_event(this_is_a_var, this_is_a_var + 1, 123, "text", false) } trigger`);
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'events',
          events: [
            {
              type: 'event',
              name: 'some_event',
              params: [
                { type: 'variable', name: 'this_is_a_var' },
                {
                  type: 'expression',
                  name: 'add',
                  elements: [
                    { type: 'variable', name: 'this_is_a_var', },
                    { type: 'literal', name: 'number', value: 1 },
                  ],
                },
                { type: 'literal', name: 'number', value: 123 },
                { type: 'literal', name: 'string', value: "text" },
                { type: 'literal', name: 'boolean', value: false },
              ]
            }
          ],
        },
        content: {
          type: 'line',
          value: 'trigger',
        },
      }]);
      expect(result).toEqual(expected);
    });

    it('trigger multiple events in one block', () => {
      const result = parse(`{ trigger some_event, another_event } trigger`);
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'events',
          events: [
            { type: 'event', name: 'some_event' },
            { type: 'event', name: 'another_event' }
        ],
        },
        content: {
          type: 'line',
          value: 'trigger',
        },
      }]);
      expect(result).toEqual(expected);
    } );

    it('standalone trigger event', () => {
      const result = parse(`{ trigger some_event }`);
      const expected = createDocPayload([{
        type: 'events',
        events: [
          { type: 'event', name: 'some_event' },
        ],
      }]);
      expect(result).toEqual(expected);
    });

    it('trigger event after line', () => {
      const result = parse(`trigger { trigger some_event }`);
      const expected = createDocPayload([{
        type: 'action_content',
        action: {
          type: 'events',
          events: [{ type: 'event', name: 'some_event' }],
        },
        content: {
          type: 'line',
          value: 'trigger',
        },
      }]);
      expect(result).toEqual(expected);
    });

    it('options trigger', () => {
      const result = parse(`
*= { trigger a } option 1
*= option 2 { trigger b }
*= { trigger c } option 3
`);
      const expected = createDocPayload([{
        type: 'options',
        content: [
          {
            type: "action_content",
            action: {
              type: 'events',
              events: [{ type: 'event', name: 'a' }],
            },
            content: { type: 'option', name: 'option 1', mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 1' },
                ],
              },
            },
          },
          {
            type: "action_content",
            action: {
              type: 'events',
              events: [{ type: 'event', name: 'b' }],
            },
            content: { type: 'option', name: 'option 2', mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 2' },
                ],
              },
            },
          },
          {
            type: "action_content",
            action: {
              type: 'events',
              events: [{ type: 'event', name: 'c' }],
            },
            content: { type: 'option', name: 'option 3', mode: 'once',
              content: {
                type: 'content',
                content: [
                  { type: 'line', value: 'option 3' },
                ],
              },
            },
          },
        ],
        }
      ]);
      expect(result).toEqual(expected);
    });
  });

  it('multiple logic blocks in the same line', () => {
    const result = parse(`{ some_var } {set something = 1} { trigger event }`);
    const expected = createDocPayload([{
      type: "conditional_content",
      conditions: { type: "variable", name: "some_var" },
      content: {
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [{
            type: 'assignment',
            variable: { type: 'variable', name: 'something' },
            operation: 'assign',
            value: { type: 'literal', name: 'number', value: 1 },
          }],
        },
        content: {
          type: 'events',
          events: [{ type: 'event', name: 'event' } ],
        },
      },
    }]);
    expect(result).toEqual(expected);
  });

  it('multiple logic blocks in the same line before', () => {
    const result = parse(`{ some_var } {set something = 1} { trigger event } hello`);
    const expected = createDocPayload([{
      type: "conditional_content",
      conditions: { type: "variable", name: "some_var" },
      content: {
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [{
            type: 'assignment',
            variable: { type: 'variable', name: 'something' },
            operation: 'assign',
            value: { type: 'literal', name: 'number', value: 1 },
          }],
        },
        content: {
          type: 'action_content',
          action: {
            type: 'events',
            events: [{ type: 'event', name: 'event' } ],
          },
          content: {
            type: 'line',
            value: 'hello',
          },
        },
      },
    }]);
    expect(result).toEqual(expected);
  });

  it('multiple logic blocks in the same line after', () => {
    const result = parse(`hello { when some_var } {set something = 1} { trigger event }`);
    const expected = createDocPayload([{
      type: "conditional_content",
      conditions: { type: "variable", name: "some_var" },
      content: {
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [{
            type: 'assignment',
            variable: { type: 'variable', name: 'something' },
            operation: 'assign',
            value: { type: 'literal', name: 'number', value: 1 },
          }],
        },
        content: {
          type: 'action_content',
          action: {
            type: 'events',
            events: [{ type: 'event', name: 'event' } ],
          },
          content: {
            type: 'line',
            value: 'hello',
          },
        },
      },
    }]);
    expect(result).toEqual(expected);
  });

  it('multiple logic blocks in the same line around', () => {
    const result = parse(`{ some_var } hello {set something = 1} { trigger event }`);
    const expected = createDocPayload([{
      type: "conditional_content",
      conditions: { type: "variable", name: "some_var" },
      content: {
        type: 'action_content',
        action: {
          type: 'assignments',
          assignments: [{
            type: 'assignment',
            variable: { type: 'variable', name: 'something' },
            operation: 'assign',
            value: { type: 'literal', name: 'number', value: 1 },
          }],
        },
        content: {
          type: 'action_content',
          action: {
            type: 'events',
            events: [{ type: 'event', name: 'event' } ],
          },
          content: {
            type: 'line',
            value: 'hello',
          },
        },
      },
    }]);
    expect(result).toEqual(expected);
  });

  it('multiple logic blocks with condition after', () => {
    const result = parse(`{set something = 1} { some_var } { trigger event } hello`);
    const expected = createDocPayload([{
      type: 'action_content',
      action: {
        type: 'assignments',
        assignments: [{
          type: 'assignment',
          variable: { type: 'variable', name: 'something' },
          operation: 'assign',
          value: { type: 'literal', name: 'number', value: 1 },
        }],
      },
      content: {
        type: "conditional_content",
        conditions: { type: "variable", name: "some_var" },
        content: {
          type: 'action_content',
          action: {
            type: 'events',
            events: [{ type: 'event', name: 'event' } ],
          },
          content: {
            type: 'line',
            value: 'hello',
          },
        },
      },
    }]);
    expect(result).toEqual(expected);
  });

  it('empty block', () => {
    const result = parse(`{} empty`);
    const expected = createDocPayload([{
      type: 'conditional_content',
      content: { type: 'line', value: 'empty', },
    }]);
    expect(result).toEqual(expected);
  });
});

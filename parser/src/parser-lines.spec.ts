import parse from "./parser";

describe("parse: lines", () => {
  it("parse single line", () => {
    const result = parse("jules: say what one more time! $first #yelling #mad");
    const expected = {
      type: "document",
      content: [
        {
          type: "content",
          content: [
            {
              type: "line",
              value: "say what one more time!",
              id: "first",
              speaker: "jules",
              tags: ["yelling", "mad"],
            },
          ],
        },
      ],
      blocks: [],
      links: {},
    };
    expect(result).toEqual(expected);
  });

  it("parse lines", () => {
    const result = parse(`
jules: say what one more time! $first #yelling #mad
just text
just id $another&var1&var2
just tags #tag
speaker: just speaker
id last #tag #another_tag $some_id
`);
    const expected = {
      type: "document",
      content: [
        {
          type: "content",
          content: [
            {
              type: "line",
              value: "say what one more time!",
              id: "first",
              speaker: "jules",
              tags: ["yelling", "mad"],
            },
            { type: "line", value: "just text" },
            { type: "line", value: "just id", id: "another", id_suffixes: ["var1", "var2"] },
            { type: "line", value: "just tags", tags: ["tag"] },
            { type: "line", value: "just speaker", speaker: "speaker" },
            { type: "line", value: "id last", id: "some_id", tags: ["tag", "another_tag"] },
          ],
        },
      ],
      blocks: [],
      links: {},
    };
    expect(result).toEqual(expected);
  });

  it("parse text in quotes", () => {
    const result = parse(`
"jules: say what one more time!
     Just say it $some_id #tag"
"hello! $id_on_first_line #and_tags
Just talking."

"this has $everything:" $id_on_first_line #and_tags
`);
    const expected = {
      type: "document",
      content: [
        {
          type: "content",
          content: [
            {
              type: "line",
              value: "jules: say what one more time!\n     Just say it $some_id #tag",
            },
            { type: "line", value: "hello! $id_on_first_line #and_tags\nJust talking." },
            {
              type: "line",
              value: "this has $everything:",
              id: "id_on_first_line",
              tags: ["and_tags"],
            },
          ],
        },
      ],
      blocks: [],
      links: {},
    };
    expect(result).toEqual(expected);
  });

  it("parse lines grouped by speaker", () => {
    const result = parse(`
jules:
  First line $first #yelling #mad
  Second line $second #sec
  Third line w multi line $third #t
    Still third line
  This is conditional { some_var }
  Fourth line $fourth
vincent:
  Another one
`);
    const expected = {
      type: "document",
      content: [
        {
          type: "content",
          content: [
            {
              type: "line",
              value: "First line",
              id: "first",
              speaker: "jules",
              tags: ["yelling", "mad"],
            },
            { type: "line", value: "Second line", id: "second", speaker: "jules", tags: ["sec"] },
            {
              type: "line",
              value: "Third line w multi line Still third line",
              id: "third",
              speaker: "jules",
              tags: ["t"],
            },
            {
              type: "conditional_content",
              conditions: { type: "variable", name: "some_var" },
              content: { type: "line", value: "This is conditional", speaker: "jules" },
            },
            { type: "line", value: "Fourth line", id: "fourth", speaker: "jules" },
            { type: "line", value: "Another one", speaker: "vincent" },
          ],
        },
      ],
      blocks: [],
      links: {},
    };
    expect(result).toEqual(expected);
  });

  it("throws error when empty string in quotes", () => {
    expect(() => parse(`speaker: ""`)).toThrow(
      /Unexpected token "EOF" on line 1 column 12. Expected text /,
    );
  });

  describe("multiline", () => {
    it("parse multiline", () => {
      const result = parse(`
jules: say what one more time!
     Just say it $some_id&suffix #tag
hello! $id_on_first_line&suffix #and_tags
     Just talking.
`);
      const expected = {
        type: "document",
        content: [
          {
            type: "content",
            content: [
              {
                type: "line",
                value: "say what one more time! Just say it",
                id: "some_id",
                speaker: "jules",
                tags: ["tag"],
                id_suffixes: ["suffix"],
              },
              {
                type: "line",
                value: "hello! Just talking.",
                id: "id_on_first_line",
                tags: ["and_tags"],
                id_suffixes: ["suffix"],
              },
            ],
          },
        ],
        blocks: [],
        links: {},
      };
      expect(result).toEqual(expected);
    });

    it("multiline with nesting in EOF", () => {
      const result = parse(`
Clyde:
  Clyde is a language for writing game dialogues.
  It supports branching, translations and interfacing
    with your game through variables and events.

`);
      const expected = {
        type: "document",
        content: [
          {
            type: "content",
            content: [
              {
                type: "line",
                value: "Clyde is a language for writing game dialogues.",
                speaker: "Clyde",
              },
              {
                type: "line",
                value:
                  "It supports branching, translations and interfacing with your game through variables and events.",
                speaker: "Clyde",
              },
            ],
          },
        ],
        blocks: [],
        links: {},
      };

      expect(result).toEqual(expected);
    });

    it("option with multiline in EOF", () => {
      const result = parse(`
*
  Clyde:
    It supports branching, translations and interfacing
      with your game through variables and events.

`);

      const expected = {
        type: "document",
        content: [
          {
            type: "content",
            content: [
              {
                type: "options",
                content: [
                  {
                    type: "option",
                    name: "It supports branching, translations and interfacing with your game through variables and events.",
                    mode: "once",
                    content: {
                      type: "content",
                      content: [
                        {
                          type: "line",
                          value:
                            "It supports branching, translations and interfacing with your game through variables and events.",
                          speaker: "Clyde",
                        },
                      ],
                    },
                    speaker: "Clyde",
                  },
                ],
              },
            ],
          },
        ],
        blocks: [],
        links: {},
      };

      expect(result).toEqual(expected);
    });

    it("conditional with multiline in EOF", () => {
      const result = parse(`
{ is_true }
  Clyde: It supports branching, translations and interfacing
    aaaa
`);
      const expected = {
        type: "document",
        content: [
          {
            type: "content",
            content: [
              {
                type: "conditional_content",
                conditions: { type: "variable", name: "is_true" },
                content: {
                  type: "content",
                  content: [
                    {
                      type: "line",
                      value: "It supports branching, translations and interfacing aaaa",
                      speaker: "Clyde",
                    },
                  ],
                },
              },
            ],
          },
        ],
        blocks: [],
        links: {},
      };

      expect(result).toEqual(expected);
    });

    it("mixed multiline edge case", () => {
      const result = parse(`Clyde:
  Clyde is a language for writing game dialogues.
    It supports branching, translations and 
    interfacing with your game through variables
    and events.
    Do you want to hear more?
      + Yes
        -> yes branch
      + No, thanks
        -> no branch
`);

      const expected = {
        type: "document",
        content: [
          {
            type: "content",
            content: [
              {
                type: "options",
                name: "Clyde is a language for writing game dialogues. It supports branching, translations and interfacing with your game through variables and events. Do you want to hear more?",
                content: [
                  {
                    type: "option",
                    name: "Yes",
                    mode: "sticky",
                    content: {
                      type: "content",
                      content: [{ type: "divert", target: "yes branch" }],
                    },
                  },
                  {
                    type: "option",
                    name: "No, thanks",
                    mode: "sticky",
                    content: {
                      type: "content",
                      content: [{ type: "divert", target: "no branch" }],
                    },
                  },
                ],
                speaker: "Clyde",
              },
            ],
          },
        ],
        blocks: [],
        links: {},
      };

      expect(result).toEqual(expected);
    });

    it("mixed multiline edge case with meta", () => {
      const result = parse(`Clyde:
  Clyde is a language for writing game dialogues. $abc #nice
    It supports branching, translations and 
    interfacing with your game through variables
    and events.
    Do you want to hear more?
      + Yes
        -> yes branch
      + No, thanks
        -> no branch
`);

      const expected = {
        type: "document",
        content: [
          {
            type: "content",
            content: [
              {
                type: "options",
                name: "Clyde is a language for writing game dialogues. It supports branching, translations and interfacing with your game through variables and events. Do you want to hear more?",
                content: [
                  {
                    type: "option",
                    name: "Yes",
                    mode: "sticky",
                    content: {
                      type: "content",
                      content: [{ type: "divert", target: "yes branch" }],
                    },
                  },
                  {
                    type: "option",
                    name: "No, thanks",
                    mode: "sticky",
                    content: {
                      type: "content",
                      content: [{ type: "divert", target: "no branch" }],
                    },
                  },
                ],
                speaker: "Clyde",
                id: "abc",
                tags: ["nice"],
              },
            ],
          },
        ],
        blocks: [],
        links: {},
      };

      expect(result).toEqual(expected);
    });
  });
});

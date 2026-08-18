import parse from "./parser";

describe("parse", () => {
  it("parse empty document", () => {
    const result = parse("");
    const expected = {
      type: "document",
      content: [],
      blocks: [],
      links: {},
    };
    expect(result).toEqual(expected);
  });

  it("parse document with multiple line breaks", () => {
    const result = parse("\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
    const expected = {
      type: "document",
      content: [],
      blocks: [],
      links: {},
    };
    expect(result).toEqual(expected);
  });

  describe("error handling", () => {
    it("throws error when wrong parsing", () => {
      expect(() => parse(`$id id should be after text`)).toThrow(
        /Unexpected token ".*" on line 1 column 1. Expected .+/,
      );
    });

    it("throws error when wrong parsing", () => {
      expect(() => parse(`speaker:`)).toThrow(
        /Unexpected token "EOF" on line 1 column 9. Expected .+/,
      );
    });

    it("constains error metadata", () => {
      try {
        parse(`$someid id should be after text`);
        fail("Parsing should not have succeeded");
      } catch (e) {
        expect(e.name).toEqual("WrongTokenError");
        expect(e.message).toContain('Unexpected token "$id" on line 1 column 1');
        expect(e.meta).toEqual({
          token: {
            token: "LINE_ID",
            line: 0,
            column: 0,
            value: "someid",
          },
          expectedTokens: expect.arrayContaining(["EOF", "SPEAKER", "TEXT"]),
        });
      }
    });
  });
});

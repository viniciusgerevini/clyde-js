import { TOKENS, tokenize } from './lexer';

describe('Lexer', () => {
  it('text', () => {
    const tokens = tokenize('this is a line').getAll();
    expect(tokens.length).toBe(1);
    expect(tokens[0]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is a line',
      line: 0,
      row: 0,
    });
  });

  it('text with multiple lines', () => {
    const tokens = tokenize('this is a line\nthis is another line 2').getAll();
    expect(tokens.length).toBe(2);
    expect(tokens[0]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is a line',
      line: 0,
      row: 0,
    });
    expect(tokens[1]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is another line 2',
      line: 1,
      row: 0
    });
  });

  it('ignores commentaries', () => {
    const tokens = tokenize(`# this is a comment
# this is another comment
this is a line
# this is a third comment
this is another line 2
# another one
`).getAll();
    expect(tokens.length).toBe(2);
    expect(tokens[0]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is a line',
      line: 0,
      row: 0,
    });
    expect(tokens[1]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is another line 2',
      line: 1,
      row: 0
    });
  });

  it('detects indents and dedents', () => {
    const tokens = tokenize(`normal line
    indented line
    indented line
      another indent
    now a dedent
now another dedent
  indent again
    one more time
dedent all the way
\t\ttab test
he he
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'normal line', line: 0, row: 0, },
      { token: TOKENS.INDENT, line: 1, row: 0 },
      { token: TOKENS.TEXT, value: 'indented line', line: 1, row: 4 },
      { token: TOKENS.TEXT, value: 'indented line', line: 2, row: 4 },
      { token: TOKENS.INDENT, line: 3, row: 4 },
      { token: TOKENS.TEXT, value: 'another indent', line: 3, row: 6 },
      { token: TOKENS.DEDENT, line: 4, row: 4 },
      { token: TOKENS.TEXT, value: 'now a dedent', line: 4, row: 4 },
      { token: TOKENS.DEDENT, line: 5, row: 0 },
      { token: TOKENS.TEXT, value: 'now another dedent', line: 5, row: 0 },
      { token: TOKENS.INDENT, line: 6, row: 0 },
      { token: TOKENS.TEXT, value: 'indent again', line: 6, row: 2 },
      { token: TOKENS.INDENT, line: 7, row: 2 },
      { token: TOKENS.TEXT, value: 'one more time', line: 7, row: 4 },
      { token: TOKENS.DEDENT, line: 8, row: 2 },
      { token: TOKENS.DEDENT, line: 8, row: 0 },
      { token: TOKENS.TEXT, value: 'dedent all the way', line: 8, row: 0 },
      { token: TOKENS.INDENT, line: 9, row: 0 },
      { token: TOKENS.TEXT, value: 'tab test', line: 9, row: 2 },
      { token: TOKENS.DEDENT, line: 10, row: 0 },
      { token: TOKENS.TEXT, value: 'he he', line: 10, row: 0 },
    ]);
  });

  it('returns line by line', () => {
    const tokens = tokenize(`normal line
    indented line
      another indent
now another dedent`);

    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'normal line', line: 0, row: 0, });
    expect(tokens.next()).toEqual({ token: TOKENS.INDENT, line: 1, row: 0 });
    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'indented line', line: 1, row: 4 });
    expect(tokens.next()).toEqual({ token: TOKENS.INDENT, line: 2, row: 4 });
    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'another indent', line: 2, row: 6 });
    expect(tokens.next()).toEqual({ token: TOKENS.DEDENT, line: 3, row: 4 });
    expect(tokens.next()).toEqual({ token: TOKENS.DEDENT, line: 3, row: 0 });
    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'now another dedent', line: 3, row: 0 });
    expect(tokens.next()).toEqual(undefined);
  });
});

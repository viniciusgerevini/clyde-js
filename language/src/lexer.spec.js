import { TOKENS, tokenize } from './lexer';

describe('Lexer', () => {
  it('text', () => {
    const tokens = tokenize('this is a line').getAll();
    expect(tokens.length).toBe(2);
    expect(tokens[0]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is a line',
      line: 0,
      row: 0,
    });
  });

  it('text with multiple lines', () => {
    const tokens = tokenize('this is a line\nthis is another line 2').getAll();
    expect(tokens.length).toBe(3);
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

  it('ignores comments', () => {
    const tokens = tokenize(`-- this is a comment
-- this is another comment
this is a line
-- this is a third comment
this is another line 2
-- another one
`).getAll();
    expect(tokens.length).toBe(3);
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
      { token: TOKENS.EOF, line: 11, row: 0 },
    ]);
  });

  it('returns EOF', () => {
    const tokens = tokenize(`normal line`);

    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'normal line', line: 0, row: 0, });
    expect(tokens.next()).toEqual({ token: TOKENS.EOF, line: 0, row: 11 });
    expect(tokens.next()).toEqual(undefined);
  });

  it('options', () => {
    const tokens = tokenize(`
this is something
  * this is another thing
    hello
  + this is a sticky option
    hello again
* a whole new list
  hello
* [ hello ]
  hi
  this is just some text with [ brackets ]
  and this is some text with * and +
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'this is something', line: 1, row: 0 },
      { token: TOKENS.INDENT, line: 2, row: 0 },
      { token: TOKENS.OPTION, line: 2, row: 2 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, row: 4 },
      { token: TOKENS.INDENT, line: 3, row: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, row: 4 },
      { token: TOKENS.DEDENT, line: 4, row: 2 },
      { token: TOKENS.STICKY_OPTION, line: 4, row: 2 },
      { token: TOKENS.TEXT, value: 'this is a sticky option', line: 4, row: 4 },
      { token: TOKENS.INDENT, line: 5, row: 2 },
      { token: TOKENS.TEXT, value: 'hello again', line: 5, row: 4 },
      { token: TOKENS.DEDENT, line: 6, row: 2 },
      { token: TOKENS.DEDENT, line: 6, row: 0 },
      { token: TOKENS.OPTION, line: 6, row: 0 },
      { token: TOKENS.TEXT, value: 'a whole new list', line: 6, row: 2 },
      { token: TOKENS.INDENT, line: 7, row: 0 },
      { token: TOKENS.TEXT, value: 'hello', line: 7, row: 2 },
      { token: TOKENS.DEDENT, line: 8, row: 0 },
      { token: TOKENS.OPTION, line: 8, row: 0 },
      { token: TOKENS.SQR_BRACKET_OPEN, line: 8, row: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 8, row: 4 },
      { token: TOKENS.SQR_BRACKET_CLOSE, line: 8, row: 10 },
      { token: TOKENS.INDENT, line: 9, row: 0 },
      { token: TOKENS.TEXT, value: 'hi', line: 9, row: 2 },
      { token: TOKENS.TEXT, value: 'this is just some text with [ brackets ]', line: 10, row: 2 },
      { token: TOKENS.TEXT, value: 'and this is some text with * and +', line: 11, row: 2 },
      { token: TOKENS.EOF, line: 12, row: 0 },
    ]);
  });

  it('speaker', () => {
    const tokens = tokenize(`
speaker1: this is something
  * speaker2: this is another thing
    speaker3: hello
  + speaker4: this is a sticky option
* [ speaker5: hello ]
  speaker 1: this is ok
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.SPEAKER, value: 'speaker1', line: 1, row: 0 },
      { token: TOKENS.TEXT, value: 'this is something', line: 1, row: 10 },
      { token: TOKENS.INDENT, line: 2, row: 0 },
      { token: TOKENS.OPTION, line: 2, row: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker2', line: 2, row: 4 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, row: 14 },
      { token: TOKENS.INDENT, line: 3, row: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker3', line: 3, row: 4 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, row: 14 },
      { token: TOKENS.DEDENT, line: 4, row: 2 },
      { token: TOKENS.STICKY_OPTION, line: 4, row: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker4', line: 4, row: 4 },
      { token: TOKENS.TEXT, value: 'this is a sticky option', line: 4, row: 14 },
      { token: TOKENS.DEDENT, line: 5, row: 0 },
      { token: TOKENS.OPTION, line: 5, row: 0 },
      { token: TOKENS.SQR_BRACKET_OPEN, line: 5, row: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker5', line: 5, row: 4 },
      { token: TOKENS.TEXT, value: 'hello', line: 5, row: 14 },
      { token: TOKENS.SQR_BRACKET_CLOSE, line: 5, row: 20 },
      { token: TOKENS.INDENT, line: 6, row: 0 },
      { token: TOKENS.SPEAKER, value: 'speaker 1', line: 6, row: 2 },
      { token: TOKENS.TEXT, value: 'this is ok', line: 6, row: 13 },
      { token: TOKENS.EOF, line: 7, row: 0 },
    ]);
  });

  it('line id', () => {
    const tokens = tokenize(`
speaker1: this is something $123
* this is another thing $abc
* [ hello $a1b2 ]
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.SPEAKER, value: 'speaker1', line: 1, row: 0 },
      { token: TOKENS.TEXT, value: 'this is something', line: 1, row: 10 },
      { token: TOKENS.LINE_ID, value: '123', line: 1, row: 28 },
      { token: TOKENS.OPTION, line: 2, row: 0 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, row: 2 },
      { token: TOKENS.LINE_ID, value: 'abc', line: 2, row: 24 },
      { token: TOKENS.OPTION, line: 3, row: 0 },
      { token: TOKENS.SQR_BRACKET_OPEN, line: 3, row: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, row: 4 },
      { token: TOKENS.LINE_ID, value: 'a1b2', line: 3, row: 10 },
      { token: TOKENS.SQR_BRACKET_CLOSE, line: 3, row: 16 },
      { token: TOKENS.EOF, line: 4, row: 0 },
    ]);
  });

  it('tags', () => {
    const tokens = tokenize(`
this is something #hello #happy #something_else
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'this is something', line: 1, row: 0 },
      { token: TOKENS.TAG, value: 'hello', line: 1, row: 18 },
      { token: TOKENS.TAG, value: 'happy', line: 1, row: 25 },
      { token: TOKENS.TAG, value: 'something_else', line: 1, row: 32 },
      { token: TOKENS.EOF, line: 2, row: 0 },
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
  });

});

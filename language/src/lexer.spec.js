import { TOKENS, tokenize, getTokenFriendlyHint } from './lexer';

describe('Lexer', () => {
  it('text', () => {
    const tokens = tokenize('this is a line').getAll();
    expect(tokens.length).toBe(2);
    expect(tokens[0]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is a line',
      line: 0,
      column: 0,
    });
  });

  it('text with multiple lines', () => {
    const tokens = tokenize('this is a line\nthis is another line 2').getAll();
    expect(tokens.length).toBe(3);
    expect(tokens[0]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is a line',
      line: 0,
      column: 0,
    });
    expect(tokens[1]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is another line 2',
      line: 1,
      column: 0
    });
  });

  it('quotted text', () => {
    const tokens = tokenize('"this is a line with: special# characters $.\\" Enjoy"').getAll();
    expect(tokens).toEqual([
      { token: TOKENS.QUOTE, line: 0, column: 0, },
      {
        token: TOKENS.TEXT,
        value: 'this is a line with: special# characters $." Enjoy',
        line: 0,
        column: 1,
      },
      { token: TOKENS.QUOTE, line: 0, column: 52, },
      { token: TOKENS.EOF, line: 0, column: 53, },
    ]);
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
      line: 2,
      column: 0,
    });
    expect(tokens[1]).toEqual({
      token: TOKENS.TEXT,
      value: 'this is another line 2',
      line: 4,
      column: 0
    });
  });

  it('count lines correctly', () => {
    const tokens = tokenize(`-- this is a comment
-- this is another comment
this is a line
-- this is a third comment
this is another line 2
"this is another line 3"
this is another line 4
-- another one
`).getAll();

    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'this is a line', line: 2, column: 0, },
      { token: TOKENS.TEXT, value: 'this is another line 2', line: 4, column: 0 },
      { token: TOKENS.QUOTE, line: 5, column: 0 },
      { token: TOKENS.TEXT, value: 'this is another line 3', line: 5, column: 1 },
      { token: TOKENS.QUOTE, line: 5, column: 23 },
      { token: TOKENS.TEXT, value: 'this is another line 4', line: 6, column: 0 },
      { token: TOKENS.EOF, line: 8, column: 0 },
    ]);
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
      { token: TOKENS.TEXT, value: 'normal line', line: 0, column: 0, },
      { token: TOKENS.INDENT, line: 1, column: 0 },
      { token: TOKENS.TEXT, value: 'indented line', line: 1, column: 4 },
      { token: TOKENS.TEXT, value: 'indented line', line: 2, column: 4 },
      { token: TOKENS.INDENT, line: 3, column: 4 },
      { token: TOKENS.TEXT, value: 'another indent', line: 3, column: 6 },
      { token: TOKENS.DEDENT, line: 4, column: 4 },
      { token: TOKENS.TEXT, value: 'now a dedent', line: 4, column: 4 },
      { token: TOKENS.DEDENT, line: 5, column: 0 },
      { token: TOKENS.TEXT, value: 'now another dedent', line: 5, column: 0 },
      { token: TOKENS.INDENT, line: 6, column: 0 },
      { token: TOKENS.TEXT, value: 'indent again', line: 6, column: 2 },
      { token: TOKENS.INDENT, line: 7, column: 2 },
      { token: TOKENS.TEXT, value: 'one more time', line: 7, column: 4 },
      { token: TOKENS.DEDENT, line: 8, column: 2 },
      { token: TOKENS.DEDENT, line: 8, column: 0 },
      { token: TOKENS.TEXT, value: 'dedent all the way', line: 8, column: 0 },
      { token: TOKENS.INDENT, line: 9, column: 0 },
      { token: TOKENS.TEXT, value: 'tab test', line: 9, column: 2 },
      { token: TOKENS.DEDENT, line: 10, column: 0 },
      { token: TOKENS.TEXT, value: 'he he', line: 10, column: 0 },
      { token: TOKENS.EOF, line: 11, column: 0 },
    ]);
  });

  it('detects indents and dedents after quoted options', () => {
    const tokens = tokenize(`
"indented line"
  * indented line
    hello

"indented line"
  * indented line
    hello
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.QUOTE, line: 1, column: 0, },
      { token: TOKENS.TEXT, value: 'indented line', line: 1, column: 1, },
      { token: TOKENS.QUOTE, line: 1, column: 14, },
      { token: TOKENS.INDENT, line: 2, column: 0 },
      { token: TOKENS.OPTION, line: 2, column: 2 },
      { token: TOKENS.TEXT, value: 'indented line', line: 2, column: 4 },
      { token: TOKENS.INDENT, line: 3, column: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, column: 4 },
      { token: TOKENS.DEDENT, line: 5, column: 2 },
      { token: TOKENS.DEDENT, line: 5, column: 0 },
      { token: TOKENS.QUOTE, line: 5, column: 0, },
      { token: TOKENS.TEXT, value: 'indented line', line: 5, column: 1, },
      { token: TOKENS.QUOTE, line: 5, column: 14, },
      { token: TOKENS.INDENT, line: 6, column: 0 },
      { token: TOKENS.OPTION, line: 6, column: 2 },
      { token: TOKENS.TEXT, value: 'indented line', line: 6, column: 4 },
      { token: TOKENS.INDENT, line: 7, column: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 7, column: 4 },
      { token: TOKENS.EOF, line: 8, column: 0 },
    ]);
  });

  it('returns EOF', () => {
    const tokens = tokenize(`normal line`);

    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'normal line', line: 0, column: 0, });
    expect(tokens.next()).toEqual({ token: TOKENS.EOF, line: 0, column: 11 });
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
      { token: TOKENS.TEXT, value: 'this is something', line: 1, column: 0 },
      { token: TOKENS.INDENT, line: 2, column: 0 },
      { token: TOKENS.OPTION, line: 2, column: 2 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, column: 4 },
      { token: TOKENS.INDENT, line: 3, column: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, column: 4 },
      { token: TOKENS.DEDENT, line: 4, column: 2 },
      { token: TOKENS.STICKY_OPTION, line: 4, column: 2 },
      { token: TOKENS.TEXT, value: 'this is a sticky option', line: 4, column: 4 },
      { token: TOKENS.INDENT, line: 5, column: 2 },
      { token: TOKENS.TEXT, value: 'hello again', line: 5, column: 4 },
      { token: TOKENS.DEDENT, line: 6, column: 2 },
      { token: TOKENS.DEDENT, line: 6, column: 0 },
      { token: TOKENS.OPTION, line: 6, column: 0 },
      { token: TOKENS.TEXT, value: 'a whole new list', line: 6, column: 2 },
      { token: TOKENS.INDENT, line: 7, column: 0 },
      { token: TOKENS.TEXT, value: 'hello', line: 7, column: 2 },
      { token: TOKENS.DEDENT, line: 8, column: 0 },
      { token: TOKENS.OPTION, line: 8, column: 0 },
      { token: TOKENS.SQR_BRACKET_OPEN, line: 8, column: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 8, column: 4 },
      { token: TOKENS.SQR_BRACKET_CLOSE, line: 8, column: 10 },
      { token: TOKENS.INDENT, line: 9, column: 0 },
      { token: TOKENS.TEXT, value: 'hi', line: 9, column: 2 },
      { token: TOKENS.TEXT, value: 'this is just some text with [ brackets ]', line: 10, column: 2 },
      { token: TOKENS.TEXT, value: 'and this is some text with * and +', line: 11, column: 2 },
      { token: TOKENS.EOF, line: 12, column: 0 },
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
      { token: TOKENS.SPEAKER, value: 'speaker1', line: 1, column: 0 },
      { token: TOKENS.TEXT, value: 'this is something', line: 1, column: 10 },
      { token: TOKENS.INDENT, line: 2, column: 0 },
      { token: TOKENS.OPTION, line: 2, column: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker2', line: 2, column: 4 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, column: 14 },
      { token: TOKENS.INDENT, line: 3, column: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker3', line: 3, column: 4 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, column: 14 },
      { token: TOKENS.DEDENT, line: 4, column: 2 },
      { token: TOKENS.STICKY_OPTION, line: 4, column: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker4', line: 4, column: 4 },
      { token: TOKENS.TEXT, value: 'this is a sticky option', line: 4, column: 14 },
      { token: TOKENS.DEDENT, line: 5, column: 0 },
      { token: TOKENS.OPTION, line: 5, column: 0 },
      { token: TOKENS.SQR_BRACKET_OPEN, line: 5, column: 2 },
      { token: TOKENS.SPEAKER, value: 'speaker5', line: 5, column: 4 },
      { token: TOKENS.TEXT, value: 'hello', line: 5, column: 14 },
      { token: TOKENS.SQR_BRACKET_CLOSE, line: 5, column: 20 },
      { token: TOKENS.INDENT, line: 6, column: 0 },
      { token: TOKENS.SPEAKER, value: 'speaker 1', line: 6, column: 2 },
      { token: TOKENS.TEXT, value: 'this is ok', line: 6, column: 13 },
      { token: TOKENS.EOF, line: 7, column: 0 },
    ]);
  });

  it('line id', () => {
    const tokens = tokenize(`
speaker1: this is something $123
* this is another thing $abc
* [ hello $a1b2 ]
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.SPEAKER, value: 'speaker1', line: 1, column: 0 },
      { token: TOKENS.TEXT, value: 'this is something', line: 1, column: 10 },
      { token: TOKENS.LINE_ID, value: '123', line: 1, column: 28 },
      { token: TOKENS.OPTION, line: 2, column: 0 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, column: 2 },
      { token: TOKENS.LINE_ID, value: 'abc', line: 2, column: 24 },
      { token: TOKENS.OPTION, line: 3, column: 0 },
      { token: TOKENS.SQR_BRACKET_OPEN, line: 3, column: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, column: 4 },
      { token: TOKENS.LINE_ID, value: 'a1b2', line: 3, column: 10 },
      { token: TOKENS.SQR_BRACKET_CLOSE, line: 3, column: 16 },
      { token: TOKENS.EOF, line: 4, column: 0 },
    ]);
  });

  it('tags', () => {
    const tokens = tokenize(`
this is something #hello #happy #something_else
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'this is something', line: 1, column: 0 },
      { token: TOKENS.TAG, value: 'hello', line: 1, column: 18 },
      { token: TOKENS.TAG, value: 'happy', line: 1, column: 25 },
      { token: TOKENS.TAG, value: 'something_else', line: 1, column: 32 },
      { token: TOKENS.EOF, line: 2, column: 0 },
    ]);
  });

  it('returns line by line', () => {
    const tokens = tokenize(`normal line
    indented line
      another indent
now another dedent`);

    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'normal line', line: 0, column: 0, });
    expect(tokens.next()).toEqual({ token: TOKENS.INDENT, line: 1, column: 0 });
    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'indented line', line: 1, column: 4 });
    expect(tokens.next()).toEqual({ token: TOKENS.INDENT, line: 2, column: 4 });
    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'another indent', line: 2, column: 6 });
    expect(tokens.next()).toEqual({ token: TOKENS.DEDENT, line: 3, column: 4 });
    expect(tokens.next()).toEqual({ token: TOKENS.DEDENT, line: 3, column: 0 });
    expect(tokens.next()).toEqual({ token: TOKENS.TEXT, value: 'now another dedent', line: 3, column: 0 });
  });


  it('parse token friendly hint', () => {
    expect(getTokenFriendlyHint(TOKENS.LINE_ID)).toEqual('$id');
    expect(getTokenFriendlyHint('some_unkown_token')).toEqual('some_unkown_token');
  });
});

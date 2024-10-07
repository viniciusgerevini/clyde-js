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
      {
        token: TOKENS.TEXT,
        value: 'this is a line with: special# characters $." Enjoy',
        line: 0,
        column: 1,
      },
      { token: TOKENS.EOF, line: 0, column: 53, },
    ]);
  });

  it('single quotes text', () => {
    const tokens = tokenize("'this is a line with: special# characters $.\\' Enjoy'").getAll();
    expect(tokens).toEqual([
      {
        token: TOKENS.TEXT,
        value: "this is a line with: special# characters $.' Enjoy",
        line: 0,
        column: 1,
      },
      { token: TOKENS.EOF, line: 0, column: 53, },
    ]);
  });

  it('text with both leading quotes', () => {
    const tokens = tokenize(`"'this' is a 'line'"`).getAll();
    expect(tokens).toEqual([
      {
        token: TOKENS.TEXT,
        value: "'this' is a 'line'",
        line: 0,
        column: 1,
      },
      { token: TOKENS.EOF, line: 0, column: 20, },
    ]);
  });

  it('string literal with both quotes', () => {
    const tokens = tokenize(`{ set characters = '{"name": "brain"}' }`).getAll();
    expect(tokens).toEqual([
      { column: 0,  line: 0, token: TOKENS.BRACE_OPEN },
      { column: 2,  line: 0, token: TOKENS.KEYWORD_SET },
      { column: 6,  line: 0, token: TOKENS.IDENTIFIER, value: 'characters'},
      { column: 17, line: 0, token: TOKENS.ASSIGN },
      { column: 19, line: 0, token: TOKENS.STRING_LITERAL, value: `{"name": "brain"}` },
      { column: 39, line: 0, token: TOKENS.BRACE_CLOSE },
      { column: 40, line: 0, token: TOKENS.EOF }
    ]);
  });

  it('escape characters in regular text', () => {
    const tokens = tokenize('this is a line with\\: special\\# characters \\$.\\" Enjoy').getAll();
    expect(tokens).toEqual([
      {
        token: TOKENS.TEXT,
        value: 'this is a line with: special# characters $." Enjoy',
        line: 0,
        column: 0,
      },
      { token: TOKENS.EOF, line: 0, column: 54, },
    ]);
  });

  it('count line correctly in quotted text with line breaks', () => {
    const tokens = tokenize('"this is a line with\nline break"\nthis should be on line 2').getAll();
    expect(tokens).toEqual([
      {
        token: TOKENS.TEXT,
        value: 'this is a line with\nline break',
        line: 0,
        column: 1,
      },
      {
        token: TOKENS.TEXT,
        value: 'this should be on line 2',
        line: 2,
        column: 0,
      },
      { token: TOKENS.EOF, line: 2, column: 24, },
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
      { token: TOKENS.TEXT, value: 'this is another line 3', line: 5, column: 1 },
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
      { token: TOKENS.TEXT, value: 'indented line', line: 1, column: 1, },
      { token: TOKENS.INDENT, line: 2, column: 0 },
      { token: TOKENS.OPTION, line: 2, column: 2 },
      { token: TOKENS.TEXT, value: 'indented line', line: 2, column: 4 },
      { token: TOKENS.INDENT, line: 3, column: 2 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, column: 4 },
      { token: TOKENS.DEDENT, line: 5, column: 2 },
      { token: TOKENS.DEDENT, line: 5, column: 0 },
      { token: TOKENS.TEXT, value: 'indented line', line: 5, column: 1, },
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
    expect(tokens.next()).toEqual({ token: TOKENS.EOF, line: 0, column: 11 });
  });

  it('options', () => {
    const tokens = tokenize(`
this is something
  * this is another thing
    hello
  + this is a sticky option
    hello again
* [a whole new list]
  hello
*= hello
  hi
  this is just some text with [ brackets ]
  and this is some text with * and + and >
> this is a fallback
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
      { token: TOKENS.TEXT, value: '[a whole new list]', line: 6, column: 2 },
      { token: TOKENS.INDENT, line: 7, column: 0 },
      { token: TOKENS.TEXT, value: 'hello', line: 7, column: 2 },
      { token: TOKENS.DEDENT, line: 8, column: 0 },
      { token: TOKENS.OPTION, line: 8, column: 0 },
      { token: TOKENS.ASSIGN, line: 8, column: 1 },
      { token: TOKENS.TEXT, value: 'hello', line: 8, column: 3 },
      { token: TOKENS.INDENT, line: 9, column: 0 },
      { token: TOKENS.TEXT, value: 'hi', line: 9, column: 2 },
      { token: TOKENS.TEXT, value: 'this is just some text with [ brackets ]', line: 10, column: 2 },
      { token: TOKENS.TEXT, value: 'and this is some text with * and + and >', line: 11, column: 2 },
      { token: TOKENS.DEDENT, line: 12, column: 0 },
      { token: TOKENS.FALLBACK_OPTION, line: 12, column: 0 },
      { token: TOKENS.TEXT, value: 'this is a fallback', line: 12, column: 2 },
      { token: TOKENS.EOF, line: 13, column: 0 },
    ]);
  });

  it('speaker', () => {
    const tokens = tokenize(`
speaker1: this is something
  * speaker2: this is another thing
    speaker3: hello
  + speaker4: this is a sticky option
*= speaker5: hello
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
      { token: TOKENS.ASSIGN, line: 5, column: 1 },
      { token: TOKENS.SPEAKER, value: 'speaker5', line: 5, column: 3 },
      { token: TOKENS.TEXT, value: 'hello', line: 5, column: 13 },
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
*= hello $a1b2
speaker1: this is something $123`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.SPEAKER, value: 'speaker1', line: 1, column: 0 },
      { token: TOKENS.TEXT, value: 'this is something', line: 1, column: 10 },
      { token: TOKENS.LINE_ID, value: '123', line: 1, column: 28 },
      { token: TOKENS.OPTION, line: 2, column: 0 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, column: 2 },
      { token: TOKENS.LINE_ID, value: 'abc', line: 2, column: 24 },
      { token: TOKENS.OPTION, line: 3, column: 0 },
      { token: TOKENS.ASSIGN, line: 3, column: 1 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, column: 3 },
      { token: TOKENS.LINE_ID, value: 'a1b2', line: 3, column: 9 },
      { token: TOKENS.SPEAKER, value: 'speaker1', line: 4, column: 0 },
      { token: TOKENS.TEXT, value: 'this is something', line: 4, column: 10 },
      { token: TOKENS.LINE_ID, value: '123', line: 4, column: 28 },
      { token: TOKENS.EOF, line: 4, column: 32 },
    ]);
  });

  it('id sufixes', () => {
    const tokens = tokenize(`
speaker1: this is something $123&var1
* this is another thing $abc&var1&var2
*= hello $a1b2&var1 #tag`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.SPEAKER, value: 'speaker1', line: 1, column: 0 },
      { token: TOKENS.TEXT, value: 'this is something', line: 1, column: 10 },
      { token: TOKENS.LINE_ID, value: '123', line: 1, column: 28 },
      { token: TOKENS.ID_SUFFIX, value: 'var1', line: 1, column: 32 },
      { token: TOKENS.OPTION, line: 2, column: 0 },
      { token: TOKENS.TEXT, value: 'this is another thing', line: 2, column: 2 },
      { token: TOKENS.LINE_ID, value: 'abc', line: 2, column: 24 },
      { token: TOKENS.ID_SUFFIX, value: 'var1', line: 2, column: 28 },
      { token: TOKENS.ID_SUFFIX, value: 'var2', line: 2, column: 33 },
      { token: TOKENS.OPTION, line: 3, column: 0 },
      { token: TOKENS.ASSIGN, line: 3, column: 1 },
      { token: TOKENS.TEXT, value: 'hello', line: 3, column: 3 },
      { token: TOKENS.LINE_ID, value: 'a1b2', line: 3, column: 9 },
      { token: TOKENS.ID_SUFFIX, value: 'var1', line: 3, column: 14 },
      { token: TOKENS.TAG, value: 'tag', line: 3, column: 20 },
      { token: TOKENS.EOF, line: 3, column: 24 },
    ]);
  });

  it('tags', () => {
    const tokens = tokenize(`
this is something #hello #happy.mm #something-else
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'this is something', line: 1, column: 0 },
      { token: TOKENS.TAG, value: 'hello', line: 1, column: 18 },
      { token: TOKENS.TAG, value: 'happy.mm', line: 1, column: 25 },
      { token: TOKENS.TAG, value: 'something-else', line: 1, column: 35 },
      { token: TOKENS.EOF, line: 2, column: 0 },
    ]);
  });

  it('blocks', () => {
    const tokens = tokenize(`
== first_block
line
line 2

== second block
line 3
line 4
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.BLOCK, value: 'first_block', line: 1, column: 0, },
      { token: TOKENS.TEXT, value: 'line', line: 2, column: 0, },
      { token: TOKENS.TEXT, value: 'line 2', line: 3, column: 0, },
      { token: TOKENS.BLOCK, value: 'second block', line: 5, column: 0, },
      { token: TOKENS.TEXT, value: 'line 3', line: 6, column: 0, },
      { token: TOKENS.TEXT, value: 'line 4', line: 7, column: 0, },
      { token: TOKENS.EOF, line: 8, column: 0 },
    ]);
  });


  describe('diverts', () => {
    it('diverts', () => {
      const tokens = tokenize(`
hello
-> first divert

* test
  -> divert
  <-
  -> END
`).getAll();
      expect(tokens).toEqual([
        { token: TOKENS.TEXT, value: 'hello', line: 1, column: 0, },
        { token: TOKENS.DIVERT, value: 'first divert', line: 2, column: 0, },
        { token: TOKENS.LINE_BREAK, line: 2, column: 15 },
        { token: TOKENS.OPTION, line: 4, column: 0 },
        { token: TOKENS.TEXT, value: 'test', line: 4, column: 2 },
        { token: TOKENS.INDENT, line: 5, column: 0 },
        { token: TOKENS.DIVERT, value: 'divert', line: 5, column: 2 },
        { token: TOKENS.LINE_BREAK, line: 5, column: 11 },
        { token: TOKENS.DIVERT_PARENT, line: 6, column: 2 },
        { token: TOKENS.LINE_BREAK, line: 6, column: 4 },
        { token: TOKENS.DIVERT, value: 'END', line: 7, column: 2 },
        { token: TOKENS.LINE_BREAK, line: 7, column: 8 },
        { token: TOKENS.EOF, line: 8, column: 0 },
      ]);
    });

    it('divert on EOF', () => {
      const tokens = tokenize(`-> div`).getAll();
      expect(tokens).toEqual([
        { token: TOKENS.DIVERT, value: 'div', line: 0, column: 0, },
        { token: TOKENS.EOF, line: 0, column: 6 },
      ]);
    });

    it('divert parent EOF', () => {
      const tokens = tokenize(`<-`).getAll();
      expect(tokens).toEqual([
        { token: TOKENS.DIVERT_PARENT, line: 0, column: 0, },
        { token: TOKENS.EOF, line: 0, column: 2 },
      ]);
    });
  });

  it('variations', () => {
    const tokens = tokenize(`
(
  - nope
  - yep
)

( shuffle
  - -> nope
  - yep
)

( shuffle once
  - nope
  - yep
  (
    - "another one"
  )
)

`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.BRACKET_OPEN, line: 1, column: 0, },
      { token: TOKENS.INDENT, line: 2, column: 0 },
      { token: TOKENS.MINUS, line: 2, column: 2, },
      { token: TOKENS.TEXT, value: 'nope', line: 2, column: 4 },
      { token: TOKENS.MINUS, line: 3, column: 2, },
      { token: TOKENS.TEXT, value: 'yep', line: 3, column: 4 },
      { token: TOKENS.DEDENT, line: 4, column: 0 },
      { token: TOKENS.BRACKET_CLOSE, line: 4, column: 0, },

      { token: TOKENS.BRACKET_OPEN, line: 6, column: 0, },
      { token: TOKENS.VARIATIONS_MODE, value: 'shuffle', line: 6, column: 2, },
      { token: TOKENS.INDENT, line: 7, column: 0 },
      { token: TOKENS.MINUS, line: 7, column: 2, },
      { token: TOKENS.DIVERT, value: 'nope', line: 7, column: 4 },
      { token: TOKENS.LINE_BREAK, line: 7, column: 11 },
      { token: TOKENS.MINUS, line: 8, column: 2, },
      { token: TOKENS.TEXT, value: 'yep', line: 8, column: 4 },
      { token: TOKENS.DEDENT, line: 9, column: 0 },
      { token: TOKENS.BRACKET_CLOSE, line: 9, column: 0, },

      { token: TOKENS.BRACKET_OPEN, line: 11, column: 0, },
      { token: TOKENS.VARIATIONS_MODE, value: 'shuffle once', line: 11, column: 2, },
      { token: TOKENS.INDENT, line: 12, column: 0 },
      { token: TOKENS.MINUS, line: 12, column: 2, },
      { token: TOKENS.TEXT, value: 'nope', line: 12, column: 4 },
      { token: TOKENS.MINUS, line: 13, column: 2, },
      { token: TOKENS.TEXT, value: 'yep', line: 13, column: 4 },

      { token: TOKENS.BRACKET_OPEN, line: 14, column: 2, },
      { token: TOKENS.INDENT, line: 15, column: 2 },
      { token: TOKENS.MINUS, line: 15, column: 4, },

      { token: TOKENS.TEXT, value: 'another one', line: 15, column: 7 },

      { token: TOKENS.DEDENT, line: 16, column: 2 },
      { token: TOKENS.BRACKET_CLOSE, line: 16, column: 2, },

      { token: TOKENS.DEDENT, line: 17, column: 0 },
      { token: TOKENS.BRACKET_CLOSE, line: 17, column: 0, },
      { token: TOKENS.EOF, line: 19, column: 0 },

    ]);
  });


  it('variables: conditions', () => {

    const tokens = tokenize(`
{ variable }
{ not variable }
{ !variable }
{ variable == variable2 }
{ variable != variable2 }
{ variable && variable2 }
{ variable || variable2 }
{ variable <= variable2 }
{ variable >= variable2 }
{ variable < variable2 }
{ variable > variable2 }
{ variable > variable2 < variable3 }

{ variable is variable2 }
{ variable isnt variable2 }
{ variable and variable2 }
{ variable or variable2 }

{ variable == 12.1 }
{ variable == true }
{ variable == false }
{ variable == "s1" }
{ _variable == null }
{ @global_variable }

`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.LINE_BREAK, line: 1, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 1, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 1, column: 2, },
      { token: TOKENS.BRACE_CLOSE, line: 1, column: 11, },
      { token: TOKENS.LINE_BREAK, line: 1, column: 12, },

      { token: TOKENS.LINE_BREAK, line: 2, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 2, column: 0, },
      { token: TOKENS.NOT, line: 2, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 2, column: 6, },
      { token: TOKENS.BRACE_CLOSE, line: 2, column: 15, },
      { token: TOKENS.LINE_BREAK, line: 2, column: 16, },

      { token: TOKENS.LINE_BREAK, line: 3, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 3, column: 0, },
      { token: TOKENS.NOT, line: 3, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 3, column: 3, },
      { token: TOKENS.BRACE_CLOSE, line: 3, column: 12, },
      { token: TOKENS.LINE_BREAK, line: 3, column: 13, },

      { token: TOKENS.LINE_BREAK, line: 4, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 4, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 4, column: 2, },
      { token: TOKENS.EQUAL, line: 4, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 4, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 4, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 4, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 5, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 5, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 5, column: 2, },
      { token: TOKENS.NOT_EQUAL, line: 5, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 5, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 5, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 5, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 6, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 6, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 6, column: 2, },
      { token: TOKENS.AND, line: 6, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 6, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 6, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 6, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 7, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 7, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 7, column: 2, },
      { token: TOKENS.OR, line: 7, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 7, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 7, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 7, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 8, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 8, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 8, column: 2, },
      { token: TOKENS.LE, line: 8, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 8, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 8, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 8, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 9, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 9, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 9, column: 2, },
      { token: TOKENS.GE, line: 9, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 9, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 9, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 9, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 10, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 10, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 10, column: 2, },
      { token: TOKENS.LESS, line: 10, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 10, column: 13, },
      { token: TOKENS.BRACE_CLOSE, line: 10, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 10, column: 24, },

      { token: TOKENS.LINE_BREAK, line: 11, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 11, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 11, column: 2, },
      { token: TOKENS.GREATER, line: 11, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 11, column: 13, },
      { token: TOKENS.BRACE_CLOSE, line: 11, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 11, column: 24, },

      { token: TOKENS.LINE_BREAK, line: 12, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 12, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 12, column: 2, },
      { token: TOKENS.GREATER, line: 12, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 12, column: 13, },
      { token: TOKENS.LESS, line: 12, column: 23, },
      { token: TOKENS.IDENTIFIER, value: 'variable3', line: 12, column: 25, },
      { token: TOKENS.BRACE_CLOSE, line: 12, column: 35, },
      { token: TOKENS.LINE_BREAK, line: 12, column: 36, },

      { token: TOKENS.LINE_BREAK, line: 14, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 14, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 14, column: 2, },
      { token: TOKENS.EQUAL, line: 14, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 14, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 14, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 14, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 15, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 15, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 15, column: 2, },
      { token: TOKENS.NOT_EQUAL, line: 15, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 15, column: 16, },
      { token: TOKENS.BRACE_CLOSE, line: 15, column: 26, },
      { token: TOKENS.LINE_BREAK, line: 15, column: 27, },

      { token: TOKENS.LINE_BREAK, line: 16, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 16, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 16, column: 2, },
      { token: TOKENS.AND, line: 16, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 16, column: 15, },
      { token: TOKENS.BRACE_CLOSE, line: 16, column: 25, },
      { token: TOKENS.LINE_BREAK, line: 16, column: 26, },

      { token: TOKENS.LINE_BREAK, line: 17, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 17, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 17, column: 2, },
      { token: TOKENS.OR, line: 17, column: 11, },
      { token: TOKENS.IDENTIFIER, value: 'variable2', line: 17, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 17, column: 24, },
      { token: TOKENS.LINE_BREAK, line: 17, column: 25, },

      { token: TOKENS.LINE_BREAK, line: 19, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 19, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 19, column: 2, },
      { token: TOKENS.EQUAL, line: 19, column: 11, },
      { token: TOKENS.NUMBER_LITERAL, value: '12.1', line: 19, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 19, column: 19, },
      { token: TOKENS.LINE_BREAK, line: 19, column: 20, },

      { token: TOKENS.LINE_BREAK, line: 20, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 20, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 20, column: 2, },
      { token: TOKENS.EQUAL, line: 20, column: 11, },
      { token: TOKENS.BOOLEAN_LITERAL, value: 'true', line: 20, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 20, column: 19, },
      { token: TOKENS.LINE_BREAK, line: 20, column: 20, },

      { token: TOKENS.LINE_BREAK, line: 21, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 21, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 21, column: 2, },
      { token: TOKENS.EQUAL, line: 21, column: 11, },
      { token: TOKENS.BOOLEAN_LITERAL, value: 'false', line: 21, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 21, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 21, column: 21, },

      { token: TOKENS.LINE_BREAK, line: 22, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 22, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 22, column: 2, },
      { token: TOKENS.EQUAL, line: 22, column: 11, },
      { token: TOKENS.STRING_LITERAL, value: 's1', line: 22, column: 14, },
      { token: TOKENS.BRACE_CLOSE, line: 22, column: 19, },
      { token: TOKENS.LINE_BREAK, line: 22, column: 20, },

      { token: TOKENS.LINE_BREAK, line: 23, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 23, column: 0, },
      { token: TOKENS.IDENTIFIER, value: '_variable', line: 23, column: 2, },
      { token: TOKENS.EQUAL, line: 23, column: 12, },
      { token: TOKENS.NULL_TOKEN, line: 23, column: 15, },
      { token: TOKENS.BRACE_CLOSE, line: 23, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 23, column: 21, },

      { token: TOKENS.LINE_BREAK, line: 24, column: 0,  },
      { token: TOKENS.BRACE_OPEN, line: 24, column: 0, },
      { token: TOKENS.IDENTIFIER, value: '@global_variable', line: 24, column: 2, },
      { token: TOKENS.BRACE_CLOSE, line: 24, column: 19, },
      { token: TOKENS.LINE_BREAK, line: 24, column: 20, },

      { token: TOKENS.EOF, line: 26, column: 0 },

    ]);
  });

  it('variables: indent', () => {
    const tokens = tokenize(`
 { a }
{ a }

`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.INDENT, line: 1, column: 0, },
      { token: TOKENS.LINE_BREAK, line: 1, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 1, column: 1, },
      { token: TOKENS.IDENTIFIER, value: 'a', line: 1, column: 3, },
      { token: TOKENS.BRACE_CLOSE, line: 1, column: 5, },
      { token: TOKENS.LINE_BREAK, line: 1, column: 6, },

      { token: TOKENS.DEDENT, line: 2, column: 0, },

      { token: TOKENS.LINE_BREAK, line: 2, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 2, column: 0, },
      { token: TOKENS.IDENTIFIER, value: 'a', line: 2, column: 2, },
      { token: TOKENS.BRACE_CLOSE, line: 2, column: 4, },
      { token: TOKENS.LINE_BREAK, line: 2, column: 5 },

      { token: TOKENS.EOF, line: 4, column: 0 },
    ]);
  });

  it('variables: init assignment', () => {
    const tokens = tokenize('{ set variable ?= 1 }').getAll();
    expect(tokens).toEqual([
      { token: TOKENS.BRACE_OPEN, line: 0, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 0, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 0, column: 6, },
      { token: TOKENS.ASSIGN_INIT, line: 0, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 0, column: 18, },
      { token: TOKENS.BRACE_CLOSE, line: 0, column: 20, },
      { token: TOKENS.EOF, line: 0, column: 21 },
    ]);
  });

  it('variables: assignements', () => {

    const tokens = tokenize(`
{ set variable = 1 }
{ set variable -= 1 }
{ set variable += 1 }
{ set variable *= 1 }
{ set variable /= 1 }
{ set variable ^= 1 }
{ set variable %= 1 }
{ set variable = a = b }

{ set variable = 1 + 2 }
{ set variable = 1 - 2 }
{ set variable = 1 * 2 }
{ set variable = 1 / 2 }
{ set variable = 1 ^ 2 }
{ set variable = 1 % 2 }

{ trigger event_name }
{ set a = 1, set b = 2 }
{ when a }

`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.LINE_BREAK, line: 1, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 1, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 1, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 1, column: 6, },
      { token: TOKENS.ASSIGN, line: 1, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 1, column: 17, },
      { token: TOKENS.BRACE_CLOSE, line: 1, column: 19, },
      { token: TOKENS.LINE_BREAK, line: 1, column: 20 },

      { token: TOKENS.LINE_BREAK, line: 2, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 2, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 2, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 2, column: 6, },
      { token: TOKENS.ASSIGN_SUB, line: 2, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 2, column: 18, },
      { token: TOKENS.BRACE_CLOSE, line: 2, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 2, column: 21 },

      { token: TOKENS.LINE_BREAK, line: 3, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 3, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 3, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 3, column: 6, },
      { token: TOKENS.ASSIGN_SUM, line: 3, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 3, column: 18, },
      { token: TOKENS.BRACE_CLOSE, line: 3, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 3, column: 21 },

      { token: TOKENS.LINE_BREAK, line: 4, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 4, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 4, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 4, column: 6, },
      { token: TOKENS.ASSIGN_MULT, line: 4, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 4, column: 18, },
      { token: TOKENS.BRACE_CLOSE, line: 4, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 4, column: 21 },

      { token: TOKENS.LINE_BREAK, line: 5, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 5, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 5, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 5, column: 6, },
      { token: TOKENS.ASSIGN_DIV, line: 5, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 5, column: 18, },
      { token: TOKENS.BRACE_CLOSE, line: 5, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 5, column: 21 },

      { token: TOKENS.LINE_BREAK, line: 6, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 6, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 6, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 6, column: 6, },
      { token: TOKENS.ASSIGN_POW, line: 6, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 6, column: 18, },
      { token: TOKENS.BRACE_CLOSE, line: 6, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 6, column: 21 },


      { token: TOKENS.LINE_BREAK, line: 7, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 7, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 7, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 7, column: 6, },
      { token: TOKENS.ASSIGN_MOD, line: 7, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 7, column: 18, },
      { token: TOKENS.BRACE_CLOSE, line: 7, column: 20, },
      { token: TOKENS.LINE_BREAK, line: 7, column: 21 },

      { token: TOKENS.LINE_BREAK, line: 8, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 8, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 8, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 8, column: 6, },
      { token: TOKENS.ASSIGN, line: 8, column: 15, },
      { token: TOKENS.IDENTIFIER, value: 'a', line: 8, column: 17, },
      { token: TOKENS.ASSIGN, line: 8, column: 19, },
      { token: TOKENS.IDENTIFIER, value: 'b', line: 8, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 8, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 8, column: 24 },

      { token: TOKENS.LINE_BREAK, line: 10, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 10, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 10, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 10, column: 6, },
      { token: TOKENS.ASSIGN, line: 10, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 10, column: 17, },
      { token: TOKENS.PLUS, line: 10, column: 19, },
      { token: TOKENS.NUMBER_LITERAL, value: '2', line: 10, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 10, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 10, column: 24 },

      { token: TOKENS.LINE_BREAK, line: 11, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 11, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 11, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 11, column: 6, },
      { token: TOKENS.ASSIGN, line: 11, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 11, column: 17, },
      { token: TOKENS.MINUS, line: 11, column: 19, },
      { token: TOKENS.NUMBER_LITERAL, value: '2', line: 11, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 11, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 11, column: 24 },

      { token: TOKENS.LINE_BREAK, line: 12, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 12, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 12, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 12, column: 6, },
      { token: TOKENS.ASSIGN, line: 12, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 12, column: 17, },
      { token: TOKENS.MULT, line: 12, column: 19, },
      { token: TOKENS.NUMBER_LITERAL, value: '2', line: 12, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 12, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 12, column: 24 },

      { token: TOKENS.LINE_BREAK, line: 13, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 13, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 13, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 13, column: 6, },
      { token: TOKENS.ASSIGN, line: 13, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 13, column: 17, },
      { token: TOKENS.DIV, line: 13, column: 19, },
      { token: TOKENS.NUMBER_LITERAL, value: '2', line: 13, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 13, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 13, column: 24 },

      { token: TOKENS.LINE_BREAK, line: 14, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 14, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 14, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 14, column: 6, },
      { token: TOKENS.ASSIGN, line: 14, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 14, column: 17, },
      { token: TOKENS.POWER, line: 14, column: 19, },
      { token: TOKENS.NUMBER_LITERAL, value: '2', line: 14, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 14, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 14, column: 24 },

      { token: TOKENS.LINE_BREAK, line: 15, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 15, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 15, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 15, column: 6, },
      { token: TOKENS.ASSIGN, line: 15, column: 15, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 15, column: 17, },
      { token: TOKENS.MOD, line: 15, column: 19, },
      { token: TOKENS.NUMBER_LITERAL, value: '2', line: 15, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 15, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 15, column: 24 },

      { token: TOKENS.LINE_BREAK, line: 17, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 17, column: 0, },
      { token: TOKENS.KEYWORD_TRIGGER, line: 17, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'event_name', line: 17, column: 10, },
      { token: TOKENS.BRACE_CLOSE, line: 17, column: 21, },
      { token: TOKENS.LINE_BREAK, line: 17, column: 22 },

      { token: TOKENS.LINE_BREAK, line: 18, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 18, column: 0, },
      { token: TOKENS.KEYWORD_SET, line: 18, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'a', line: 18, column: 6, },
      { token: TOKENS.ASSIGN, line: 18, column: 8, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 18, column: 10, },
      { token: TOKENS.COMMA, line: 18, column: 11, },
      { token: TOKENS.KEYWORD_SET, line: 18, column: 13, },
      { token: TOKENS.IDENTIFIER, value: 'b', line: 18, column: 17, },
      { token: TOKENS.ASSIGN, line: 18, column: 19, },
      { token: TOKENS.NUMBER_LITERAL, value: '2', line: 18, column: 21, },
      { token: TOKENS.BRACE_CLOSE, line: 18, column: 23, },
      { token: TOKENS.LINE_BREAK, line: 18, column: 24 },


      { token: TOKENS.LINE_BREAK, line: 19, column: 0 },
      { token: TOKENS.BRACE_OPEN, line: 19, column: 0, },
      { token: TOKENS.KEYWORD_WHEN, line: 19, column: 2, },
      { token: TOKENS.IDENTIFIER, value: 'a', line: 19, column: 7, },
      { token: TOKENS.BRACE_CLOSE, line: 19, column: 9, },
      { token: TOKENS.LINE_BREAK, line: 19, column: 10 },

      { token: TOKENS.EOF, line: 21, column: 0 },
    ]);
  });

  it('variables: assignment after line', () => {

    const tokens = tokenize(`this line { set variable = 1 }`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'this line', line: 0, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 0, column: 10, },
      { token: TOKENS.KEYWORD_SET, line: 0, column: 12, },
      { token: TOKENS.IDENTIFIER, value: 'variable', line: 0, column: 16, },
      { token: TOKENS.ASSIGN, line: 0, column: 25, },
      { token: TOKENS.NUMBER_LITERAL, value: '1', line: 0, column: 27, },
      { token: TOKENS.BRACE_CLOSE, line: 0, column: 29, },
      { token: TOKENS.EOF, line: 0, column: 30, },
    ]);
  });

  it('includes line break when just after or before a logic block', () => {

    const tokens = tokenize(`
after {}
{} before
both
{}
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.TEXT, value: 'after', line: 1, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 1, column: 6, },
      { token: TOKENS.BRACE_CLOSE, line: 1, column: 7, },
      { token: TOKENS.LINE_BREAK, line: 1, column: 8, },

      { token: TOKENS.LINE_BREAK, line: 2, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 2, column: 0, },
      { token: TOKENS.BRACE_CLOSE, line: 2, column: 1, },
      { token: TOKENS.TEXT, value: 'before', line: 2, column: 3, },

      { token: TOKENS.TEXT, value: 'both', line: 3, column: 0, },
      { token: TOKENS.LINE_BREAK, line: 4, column: 0, },
      { token: TOKENS.BRACE_OPEN, line: 4, column: 0, },
      { token: TOKENS.BRACE_CLOSE, line: 4, column: 1, },
      { token: TOKENS.LINE_BREAK, line: 4, column: 2, },
      { token: TOKENS.EOF, line: 5, column: 0, },
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

  it('does not fail when leaving mode', () => {
    const tokens = tokenize('))');
    expect(() => tokens.getAll()).not.toThrow();
  });

  it('produces same blocks for tabbed and spaced indentation', () => {
    const tokens = tokenize(`
Pick an option.
 + Quest test
  { QUEST_STARTED } How's that quest going? (you should see this line at some point)
  { not QUEST_STARTED } I have a quest for you! {set QUEST_STARTED = true}
  <-
{no QUEST_STARTED}
 blah { not QUEST_STARTED} 
 bleh { QUEST_STARTED}
`).getAll();

    const tabTokens = tokenize(`
Pick an option.
	+ Quest test
		{ QUEST_STARTED } How's that quest going? (you should see this line at some point)
		{ not QUEST_STARTED } I have a quest for you! {set QUEST_STARTED = true}
		<-
{no QUEST_STARTED}
	blah { not QUEST_STARTED}	
	bleh { QUEST_STARTED}
`).getAll();

    expect(tabTokens).toEqual(tokens);
  });

  it('file links', () => {
    const tokens = tokenize(`
@link to_import
@link common = ./to_import
@link common2 = to_import
@link common3 = res://test/dialogue_samples/to_import.clyde

-> @common.some_block_name
-> @common
`).getAll();
    expect(tokens).toEqual([
      { token: TOKENS.LINK_FILE, value: JSON.stringify({ name: 'to_import', path: 'to_import'}), line: 1, column: 0, },
      { token: TOKENS.LINK_FILE, value: JSON.stringify({ name: 'common', path: './to_import'}), line: 2, column: 0, },
      { token: TOKENS.LINK_FILE, value: JSON.stringify({ name: 'common2', path: 'to_import'}), line: 3, column: 0, },
      { token: TOKENS.LINK_FILE, value: JSON.stringify({ name: 'common3', path: 'res://test/dialogue_samples/to_import.clyde'}), line: 4, column: 0, },

      { token: TOKENS.DIVERT, value: JSON.stringify({ link: 'common', block: 'some_block_name' }), line: 6, column: 0, },
      { token: TOKENS.LINE_BREAK, line: 6, column: 26, },
      { token: TOKENS.DIVERT, value: JSON.stringify({ link: 'common', block: '' }), line: 7, column: 0, },
      { token: TOKENS.LINE_BREAK, line: 7, column: 10, },

      { token: TOKENS.EOF, line: 8, column: 0, },
    ]);
  });
});

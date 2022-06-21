import { addIds } from './id_generator';

describe('ID Generator', () => {
  const fakeIdfunction = () => "abc";

  it('adds id to simple line content', () => {
    const clydeContent = 'This';
    expect(addIds(clydeContent)).toMatch(/This \$[A-z|0-9]{9}/);
  });

  it('adds ids using custom id generator', () => {
    const clydeContent = `
This is the first line
This is the second line
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
This is the first line $abc
This is the second line $abc
    `);
  });

  it('keeps existing ids', () => {
    const clydeContent = `
This is the first line
This is the second line $existingId
This is the third line
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
This is the first line $abc
This is the second line $existingId
This is the third line $abc
    `);
  });

  it('keeps id among tags', () => {
    const clydeContent = `
This is the first line #tag
This is the second line #some_tag $existingId #another_tag
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
This is the first line $abc #tag
This is the second line #some_tag $existingId #another_tag
    `);
  });

  it('adds to multiline', () => {
    const clydeContent = `
speaker: this is the
         first multiline
speaker: this is a
         multiline with id $some
speaker: this is a second $some
         mline with id
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
speaker: this is the
         first multiline $abc
speaker: this is a
         multiline with id $some
speaker: this is a second $some
         mline with id
    `);
  });

  it('adds to options', () => {
    const clydeContent = `
does it work?
  * it should
  * it should with text
    maybe
  + should sticky
    maybe
  + should not sticky $123
  > should fallback
    maybe
  > should not fallback $123
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
does it work? $abc
  * it should $abc
  * it should with text $abc
    maybe $abc
  + should sticky $abc
    maybe $abc
  + should not sticky $123
  > should fallback $abc
    maybe $abc
  > should not fallback $123
    `);
  });

  it('adds to variations', () => {
    const clydeContent = `
does it work?
(
  - Yes, it does
  - Yes, I guess.
  - Probably
  - Does not do this one $123
  - but do this
    as much as possible
  -
    hello darkness my old friend
    I come to talk to you again
)
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
does it work? $abc
(
  - Yes, it does $abc
  - Yes, I guess. $abc
  - Probably $abc
  - Does not do this one $123
  - but do this
    as much as possible $abc
  -
    hello darkness my old friend $abc
    I come to talk to you again $abc
)
    `);
  });

  it('adds to quotted text', () => {
    const clydeContent = `
"this is a text"
"this is another text"
"this text doesn't need ids" $123
"this text has
line breaks"
'this uses simple quotes'
* "quotes with line
breaks for the win"
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
"this is a text" $abc
"this is another text" $abc
"this text doesn't need ids" $123
"this text has
line breaks" $abc
'this uses simple quotes' $abc
* "quotes with line
breaks for the win" $abc
    `);
  });

  it('ignore logic blocks', () => {
    const clydeContent = `
Hello { set a = "we should totally ignore blocks" }
{ set a = "for realz" }
{ set a = "with line breaks \n" }
still counts
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
Hello $abc { set a = "we should totally ignore blocks" }
{ set a = "for realz" }
{ set a = "with line breaks \n" }
still counts $abc
    `);
  });

  it('ignore comments', () => {
    const clydeContent = `
Hello
-- do nothing with this line
-- or this
still counts
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
Hello $abc
-- do nothing with this line
-- or this
still counts $abc
    `);
  });

  it('handle some nasty nesting', () => {
    const clydeContent = `
* hello
    what are my options
        * don't know
        * don't care
+ some nesting
    (
        - yep
          nope
        - yeah
          nah
        -
          yes
          for sure
    )
    and normal text
      with indent
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
* hello $abc
    what are my options $abc
        * don't know $abc
        * don't care $abc
+ some nesting $abc
    (
        - yep
          nope $abc
        - yeah
          nah $abc
        -
          yes $abc
          for sure $abc
    )
    and normal text
      with indent $abc
    `);
  });
});

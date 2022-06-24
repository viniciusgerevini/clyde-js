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
  *= display option
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
  *= display option $abc
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

  it("test with real file", () => {
    const clydeContent = `-- Pulp Fiction: Jules and Vincent first car scene.
-- adapted for showing off features.

{ not introductionMade } Jules: Okay now, tell me about that. { set introductionMade =  true, europeTopicsTalked = 0 }
Vincent: What do you want to know?
  *= Jules: Is hash legal there?
    Vincent: Yes, but is ain't a hundred percent legal.
             I mean you can't walk into a restaurant, roll a joint,
             and start puffin' away. You're only supposed to smoke in
             your home or certain designated places.
    Jules: Those are hash bars?
    Vincent: Yeah, it breaks down like this\: it's legal to buy it,
             it's legal to own it and, if you're the proprietor of a
             hash bar, it's legal to sell it. It's legal to carry it,
             which doesn't really matter ' cause - get a load of this -
             if the cops stop you, it's illegal for this to search you.
             Searching you is a right that the cops in Amsterdam don't have.
    Jules: That did it, man - I'm f**n' goin', that's all there is to it.
    <-
  + { europeTopicsTalked < 4 }  Something about Europe.
    { europeTopicsTalked == 0 }
             Vincent: You know what the funniest thing about Europe is?
             Jules: what?
             Vincent: It's the little differences. A lotta the same sh*t we got here,
                      they got there, but there they're a little different.
    (
      - Jules: Examples?
      - Jules: Tell me more about Europe.
    )

    About Europe...
      * You can buy beer in movie theatres.
        Vincent: Well, in Amsterdam, you can buy beer in a
                 movie theatre.
        Vincent: And I don't mean in a paper
                 cup either. They give you a glass of beer,
        { set europeTopicsTalked += 1}
        <-
      *= Vincent: You know what they call a Quarter Pounder with Cheese in Paris?
        Jules: They don't call it a Quarter Pounder with Cheese?
        Vincent: No, they got the metric system there, they wouldn't know what
                 the f a Quarter Pounder is.
        Jules: What'd they call it?
        Vincent: Royale with Cheese.
        Jules: Royale with cheese. What'd they call a Big Mac?
        Vincent: Big Mac's a Big Mac, but they call it Le Big Mac.
        { set quarterPounderTalkCompleted = true }
        { set europeTopicsTalked += 1}
        <-
      *= { quarterPounderTalkCompleted } Jules: What do they call a Whopper?
                                        Vincent: I dunno, I didn't go into a Burger King.
                                        { set europeTopicsTalked += 1}
                                        <-
      * What they put on the french fries instead of ketchup.
        Vincent: You know what they put on french fries in Holland
                 instead of ketchup?
        Jules: What?
        Vincent: Mayonnaise.
        Jules: Goddamn!
        Vincent: I seen 'em do it. And I don't mean a little bit
                 on the side of the plate, they freakin' drown 'em in it.
        Jules: Uuccch!
        { set europeTopicsTalked += 1}
        <-
      + { OPTIONS_COUNT > 1 } I'm suddenly not interested anymore.
        Jules: We talk about this another time.
    { set europeTalkCompleted = true }
    <-
  + { OPTIONS_COUNT > 1 } Nah, maybe another time
    ( shuffle
       - Vincent: Alright!
       - Vincent: No problem!
       - Vincent: Ok!
    )

Jules: Enough talk. Let's get to work!
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`-- Pulp Fiction: Jules and Vincent first car scene.
-- adapted for showing off features.

{ not introductionMade } Jules: Okay now, tell me about that. $abc { set introductionMade =  true, europeTopicsTalked = 0 }
Vincent: What do you want to know? $abc
  *= Jules: Is hash legal there? $abc
    Vincent: Yes, but is ain't a hundred percent legal.
             I mean you can't walk into a restaurant, roll a joint,
             and start puffin' away. You're only supposed to smoke in
             your home or certain designated places. $abc
    Jules: Those are hash bars? $abc
    Vincent: Yeah, it breaks down like this\: it's legal to buy it,
             it's legal to own it and, if you're the proprietor of a
             hash bar, it's legal to sell it. It's legal to carry it,
             which doesn't really matter ' cause - get a load of this -
             if the cops stop you, it's illegal for this to search you.
             Searching you is a right that the cops in Amsterdam don't have. $abc
    Jules: That did it, man - I'm f**n' goin', that's all there is to it. $abc
    <-
  + { europeTopicsTalked < 4 }  Something about Europe. $abc
    { europeTopicsTalked == 0 }
             Vincent: You know what the funniest thing about Europe is? $abc
             Jules: what? $abc
             Vincent: It's the little differences. A lotta the same sh*t we got here,
                      they got there, but there they're a little different. $abc
    (
      - Jules: Examples? $abc
      - Jules: Tell me more about Europe. $abc
    )

    About Europe... $abc
      * You can buy beer in movie theatres. $abc
        Vincent: Well, in Amsterdam, you can buy beer in a
                 movie theatre. $abc
        Vincent: And I don't mean in a paper
                 cup either. They give you a glass of beer, $abc
        { set europeTopicsTalked += 1}
        <-
      *= Vincent: You know what they call a Quarter Pounder with Cheese in Paris? $abc
        Jules: They don't call it a Quarter Pounder with Cheese? $abc
        Vincent: No, they got the metric system there, they wouldn't know what
                 the f a Quarter Pounder is. $abc
        Jules: What'd they call it? $abc
        Vincent: Royale with Cheese. $abc
        Jules: Royale with cheese. What'd they call a Big Mac? $abc
        Vincent: Big Mac's a Big Mac, but they call it Le Big Mac. $abc
        { set quarterPounderTalkCompleted = true }
        { set europeTopicsTalked += 1}
        <-
      *= { quarterPounderTalkCompleted } Jules: What do they call a Whopper? $abc
                                        Vincent: I dunno, I didn't go into a Burger King. $abc
                                        { set europeTopicsTalked += 1}
                                        <-
      * What they put on the french fries instead of ketchup. $abc
        Vincent: You know what they put on french fries in Holland
                 instead of ketchup? $abc
        Jules: What? $abc
        Vincent: Mayonnaise. $abc
        Jules: Goddamn! $abc
        Vincent: I seen 'em do it. And I don't mean a little bit
                 on the side of the plate, they freakin' drown 'em in it. $abc
        Jules: Uuccch! $abc
        { set europeTopicsTalked += 1}
        <-
      + { OPTIONS_COUNT > 1 } I'm suddenly not interested anymore. $abc
        Jules: We talk about this another time. $abc
    { set europeTalkCompleted = true }
    <-
  + { OPTIONS_COUNT > 1 } Nah, maybe another time $abc
    ( shuffle
       - Vincent: Alright! $abc
       - Vincent: No problem! $abc
       - Vincent: Ok! $abc
    )

Jules: Enough talk. Let's get to work! $abc
    `);
  });
});

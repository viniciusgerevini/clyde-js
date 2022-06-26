import { addIds } from './id_generator';

describe('ID Generator', () => {
  let idIncrement = 0;
  const fakeIdfunction = () => `abc${idIncrement++}`;

  beforeEach(() => {
    idIncrement = 0;
  });

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
This is the first line $abc0
This is the second line $abc1
    `);
  });

  it('keeps existing ids', () => {
    const clydeContent = `
This is the first line
This is the second line $existingId
This is the third line
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
This is the first line $abc0
This is the second line $existingId
This is the third line $abc1
    `);
  });

  it('avoids id clashing', () => {
    const clydeContent = `
This is the first line
This is the second line $abc1
This is the third line
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
This is the first line $abc0
This is the second line $abc1
This is the third line $abc2
    `);
  });

  it('keeps id among tags', () => {
    const clydeContent = `
This is the first line #tag
This is the second line #some_tag $existingId #another_tag
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction })).toEqual(`
This is the first line $abc0 #tag
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
         first multiline $abc0
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
does it work? $abc0
  * it should $abc1
  * it should with text $abc2
    maybe $abc3
  + should sticky $abc4
    maybe $abc5
  + should not sticky $123
  > should fallback $abc6
    maybe $abc7
  > should not fallback $123
  *= display option $abc8
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
does it work? $abc0
(
  - Yes, it does $abc1
  - Yes, I guess. $abc2
  - Probably $abc3
  - Does not do this one $123
  - but do this
    as much as possible $abc4
  -
    hello darkness my old friend $abc5
    I come to talk to you again $abc6
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
"this is a text" $abc0
"this is another text" $abc1
"this text doesn't need ids" $123
"this text has
line breaks" $abc2
'this uses simple quotes' $abc3
* "quotes with line
breaks for the win" $abc4
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
Hello $abc0 { set a = "we should totally ignore blocks" }
{ set a = "for realz" }
{ set a = "with line breaks \n" }
still counts $abc1
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
Hello $abc0
-- do nothing with this line
-- or this
still counts $abc1
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
* hello $abc0
    what are my options $abc1
        * don't know $abc2
        * don't care $abc3
+ some nesting $abc4
    (
        - yep
          nope $abc5
        - yeah
          nah $abc6
        -
          yes $abc7
          for sure $abc8
    )
    and normal text
      with indent $abc9
    `);
  });

  it('uses id prefix', () => {
    const clydeContent = `
This is the first line
This is the second line $abc1
This is the third line
    `;
    expect(addIds(clydeContent, { idGenerator: fakeIdfunction, idPrefix: 'MY_PREFIX_' })).toEqual(`
This is the first line $MY_PREFIX_abc0
This is the second line $abc1
This is the third line $MY_PREFIX_abc1
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

{ not introductionMade } Jules: Okay now, tell me about that. $abc0 { set introductionMade =  true, europeTopicsTalked = 0 }
Vincent: What do you want to know? $abc1
  *= Jules: Is hash legal there? $abc2
    Vincent: Yes, but is ain't a hundred percent legal.
             I mean you can't walk into a restaurant, roll a joint,
             and start puffin' away. You're only supposed to smoke in
             your home or certain designated places. $abc3
    Jules: Those are hash bars? $abc4
    Vincent: Yeah, it breaks down like this\: it's legal to buy it,
             it's legal to own it and, if you're the proprietor of a
             hash bar, it's legal to sell it. It's legal to carry it,
             which doesn't really matter ' cause - get a load of this -
             if the cops stop you, it's illegal for this to search you.
             Searching you is a right that the cops in Amsterdam don't have. $abc5
    Jules: That did it, man - I'm f**n' goin', that's all there is to it. $abc6
    <-
  + { europeTopicsTalked < 4 }  Something about Europe. $abc7
    { europeTopicsTalked == 0 }
             Vincent: You know what the funniest thing about Europe is? $abc8
             Jules: what? $abc9
             Vincent: It's the little differences. A lotta the same sh*t we got here,
                      they got there, but there they're a little different. $abc10
    (
      - Jules: Examples? $abc11
      - Jules: Tell me more about Europe. $abc12
    )

    About Europe... $abc13
      * You can buy beer in movie theatres. $abc14
        Vincent: Well, in Amsterdam, you can buy beer in a
                 movie theatre. $abc15
        Vincent: And I don't mean in a paper
                 cup either. They give you a glass of beer, $abc16
        { set europeTopicsTalked += 1}
        <-
      *= Vincent: You know what they call a Quarter Pounder with Cheese in Paris? $abc17
        Jules: They don't call it a Quarter Pounder with Cheese? $abc18
        Vincent: No, they got the metric system there, they wouldn't know what
                 the f a Quarter Pounder is. $abc19
        Jules: What'd they call it? $abc20
        Vincent: Royale with Cheese. $abc21
        Jules: Royale with cheese. What'd they call a Big Mac? $abc22
        Vincent: Big Mac's a Big Mac, but they call it Le Big Mac. $abc23
        { set quarterPounderTalkCompleted = true }
        { set europeTopicsTalked += 1}
        <-
      *= { quarterPounderTalkCompleted } Jules: What do they call a Whopper? $abc24
                                        Vincent: I dunno, I didn't go into a Burger King. $abc25
                                        { set europeTopicsTalked += 1}
                                        <-
      * What they put on the french fries instead of ketchup. $abc26
        Vincent: You know what they put on french fries in Holland
                 instead of ketchup? $abc27
        Jules: What? $abc28
        Vincent: Mayonnaise. $abc29
        Jules: Goddamn! $abc30
        Vincent: I seen 'em do it. And I don't mean a little bit
                 on the side of the plate, they freakin' drown 'em in it. $abc31
        Jules: Uuccch! $abc32
        { set europeTopicsTalked += 1}
        <-
      + { OPTIONS_COUNT > 1 } I'm suddenly not interested anymore. $abc33
        Jules: We talk about this another time. $abc34
    { set europeTalkCompleted = true }
    <-
  + { OPTIONS_COUNT > 1 } Nah, maybe another time $abc35
    ( shuffle
       - Vincent: Alright! $abc36
       - Vincent: No problem! $abc37
       - Vincent: Ok! $abc38
    )

Jules: Enough talk. Let's get to work! $abc39
    `);
  });
});

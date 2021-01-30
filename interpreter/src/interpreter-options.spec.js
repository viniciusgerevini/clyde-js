import { parse } from 'clyde-parser';
import { Interpreter } from './interpreter';

describe("Interpreter: options", () => {

  it('continue flow after selecting an option', () => {
    const content = parse('\nHey hey\nspeaker: hello\n  * [a]\n   aa\n   ab\n  * [b]\n   ba\n   bb\nend\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hey hey' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b' }] });
    dialogue.choose(1)
    expect(dialogue.getContent()).toEqual({ type: 'line',  text: 'ba' });
    expect(dialogue.getContent()).toEqual({ type: 'line',  text: 'bb' });
    expect(dialogue.getContent()).toEqual({ type: 'line',  text: 'end' });
  });

  it('handle sticky and normal options', () => {
    const content = parse('speaker: hello #name_tag\n  * [a]\n   aa\n   ab\n  * [b $abc #option_tag]\n   ba\n   bb\n  + [c]\n   ca\n   cb\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', tags: [ 'name_tag' ], options: [{ label: 'a' },{ label: 'b', id: 'abc', tags: [ 'option_tag' ] }, { label: 'c' } ] });
    dialogue.choose(1)
    expect(dialogue.getContent()).toEqual({ type: 'line',  text: 'ba' });
    expect(dialogue.getContent()).toEqual({ type: 'line',  text: 'bb' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', tags: [ 'name_tag' ], options: [{ label: 'a' }, { label: 'c' } ] });
    dialogue.choose(1)

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'ca' });
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'cb' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', tags: [ 'name_tag' ], options: [{ label: 'a' }, { label: 'c' } ] });

    dialogue.choose(0)
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'aa' });
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'ab' });
    expect(dialogue.getContent()).toEqual(undefined);
  });

  it('expose special variable OPTIONS_COUNT', () => {
    const content = parse('speaker: hello\n  * [a]\n   a %OPTIONS_COUNT%\n  * [b]\n   b %OPTIONS_COUNT%\n  * [c %OPTIONS_COUNT% left]\n   c %OPTIONS_COUNT%\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b' }, { label: 'c 3 left' } ] });
    dialogue.choose(1);
    expect(dialogue.getContent()).toEqual({ type: 'line',  text: 'b 2' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c 2 left' } ] });
    dialogue.choose(0);

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'a 1' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'c 1 left' } ] });

    dialogue.choose(0);
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'c 0' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual(undefined);
  });

  it('use special variable OPTIONS_COUNT as condition', () => {
    const content = parse(`
hello %OPTIONS_COUNT%
    * [Yes]
      yep
      <-
    * [No]
      nope
      <-
    + { OPTIONS_COUNT > 1 } [What?]
      wat
      <-
`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello 3', options: [{ label: 'Yes' },{ label: 'No' }, { label: 'What?' } ] });
    dialogue.choose(2);
    expect(dialogue.getContent()).toEqual({ type: 'line',  text: 'wat' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello 3', options: [{ label: 'Yes' },{ label: 'No' }, { label: 'What?' } ] });
    dialogue.choose(0)
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'yep' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello 2', options: [ { label: 'No' }, { label: 'What?' } ] });

    dialogue.choose(0)
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'nope' });
    expect(dialogue.getContent()).toEqual(undefined);
  });

  it('fails when trying to select option when in wrong state', () => {
    const content = parse('Hi!\n');
    const dialogue = Interpreter(content);
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hi!' });

    expect(() => dialogue.choose(0)).toThrow(/Nothing to select./);
  });

  it('fails when selecting wrong index', () => {
    const content = parse('hello $123\n * [a]\n  aa\n * [b]\n  ba\n');
    const dialogue = Interpreter(content);
    expect(dialogue.getContent()).toEqual({ id: '123', type: 'options', name: 'hello', options: [{ label: 'a' }, { label: 'b' } ] });
    expect(() => dialogue.choose(66)).toThrow(/Index 66 not available./);
  });


  it('complex conditional state', () =>{
    const content = parse(`
{ set europeTopicsTalked = 0 }
Vincent: What do you want to know?
  * [Is hash legal there?]
    Jules: is hash legal there?
    Vincent: yes, but is ain't a hundred percent legal.
             I mean you can't walk into a restaurant, roll a joint,
             and start puffin' away. You're only supposed to smoke in
             your home or certain designated places.
    Jules: Those are hash bars?
    Vincent: "Yeah, it breaks down like this: it's legal to buy it,
             it's legal to own it and, if you're the proprietor of a
             hash bar, it's legal to sell it. It's legal to carry it,
             which doesn't really matter ' cause - get a load of this -
             if the cops stop you, it's illegal for this to search you.
             Searching you is a right that the cops in Amsterdam don't have."
    Jules: That did it, man - I'm f**n' goin', that's all there is to it.
    <-
  + { europeTopicsTalked < 4 } [Something about Europe.]
    Vincent: You know what the funniest thing about Europe is?
    Jules: what?
    Vincent: It's the little differences. A lotta the same sh*t we got here, they
             they got there, but there they're a little different.
    Jules: Examples?
      * [You can buy a beer in a movie theatre.]
        Vincent: Well, in Amsterdam, you can buy beer in a
                 movie theatre. And I don't mean in a paper
                 cup either. They give you a glass of beer,
        { set europeTopicsTalked += 1}
        <-
      * [You know what they call a Quarter Pounder with Cheese in Paris?]
        Vincent: You know what they call a Quarter Pounder with Cheese in Paris?
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
      * { quarterPounderTalkCompleted } [What do they call a Whopper?]
        Jules: What do they call a Whopper?
        Vincent: I dunno, I didn't go into a Burger King.
        { set europeTopicsTalked += 1}
      * [What they put on the french fries instead of ketchup.]
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
      + { OPTIONS_COUNT > 1 } [I'm suddenly not interested anymore.]
        Jules: We talk about this another time.
    { set europeTalkCompleted = true }
    <-
  + { OPTIONS_COUNT > 1 } [Nah, maybe another time]
        (
          - Vincent: Alright!
          - Vincent: No problem!
          - Vincent: See yah!
        )
Jules: Let's get to work!
`
    );
    const dialogue = Interpreter(content);
    const firstOptions = [{ label: 'Is hash legal there?'}, { label: 'Something about Europe.' }, { label: 'Nah, maybe another time' }];
    const secondOptions = [
      { label: 'You can buy a beer in a movie theatre.' },
      { label: 'You know what they call a Quarter Pounder with Cheese in Paris?' },
      { label: 'What they put on the french fries instead of ketchup.' },
      { label: "I'm suddenly not interested anymore." },
    ];

    expect(dialogue.getContent()).toEqual({ type: 'options', speaker: 'Vincent', name: 'What do you want to know?', options: firstOptions });

    dialogue.choose(1);
    expect(dialogue.getContent().text).toEqual('You know what the funniest thing about Europe is?');
    expect(dialogue.getContent().text).toEqual('what?');
    expect(dialogue.getContent().text).toEqual("It's the little differences. A lotta the same sh*t we got here, they they got there, but there they're a little different.");
    expect(dialogue.getContent()).toEqual({ type: 'options', speaker: 'Jules', name: 'Examples?', options: secondOptions });

    dialogue.choose(0);

    expect(dialogue.getContent().text).toEqual("Well, in Amsterdam, you can buy beer in a movie theatre. And I don't mean in a paper cup either. They give you a glass of beer,");
    secondOptions.splice(0, 1);
    expect(dialogue.getContent()).toEqual({ type: 'options', speaker: 'Jules', name: 'Examples?', options: secondOptions });
  });

  it('shows label for action content', () => {
    const content = parse(`
Hey hey
speaker: hello
      * a { set something = true }
      * b { when not something }
hey
`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hey hey' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b' }] });
    dialogue.choose(0);
    expect(dialogue.getContent().text).toEqual('a');
    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hey hey' });
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'hey' });
  });

  it('allows lines after block', () => {
    const content = parse(`
Hey hey
speaker: hello
      * a { set something = true }
        hey you
      * b
hey
`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hey hey' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b' }] });
    dialogue.choose(0);
    expect(dialogue.getContent().text).toEqual('a');
    expect(dialogue.getContent().text).toEqual('hey you');
    expect(dialogue.getContent().text).toEqual('hey');
  });
});


const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('./interpreter');

describe("Interpreter: options", () => {

  it('continue flow after selecting an option', () => {
    const parser = Parser();
    const content = parser.parse('\nHey hey\n>> speaker: hello\n  * a\n   aa\n   ab\n  * b\n   ba\n   bb\n<<\nend\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hey hey' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b' }] });
    dialogue.choose(1)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'ba' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'bb' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'end' });
  });

  it('handle sticky and normal options', () => {
    const parser = Parser();
    const content = parser.parse('>> speaker: hello\n  * a\n   aa\n   ab\n  * b $id:abc\n   ba\n   bb\n  + c\n   ca\n   cb\n<<\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b', id: 'abc' }, { label: 'c' } ] });
    dialogue.choose(1)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'ba' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'bb' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });
    dialogue.choose(1)

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'ca' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'cb' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });

    dialogue.choose(0)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'aa' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'ab' });
    expect(dialogue.getContent()).toEqual(undefined);
  });

  it('expose special variable OPTIONS_COUNT', () => {
    const parser = Parser();
    const content = parser.parse('>> speaker: hello\n  * a\n   a %OPTIONS_COUNT%\n  * b\n   b %OPTIONS_COUNT%\n  * c %OPTIONS_COUNT% left\n   c %OPTIONS_COUNT%\n<<\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b' }, { label: 'c 3 left' } ] });
    dialogue.choose(1);
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'b 2' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c 2 left' } ] });
    dialogue.choose(0);

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'a 1' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'c 1 left' } ] });

    dialogue.choose(0);
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'c 0' });
    expect(dialogue.getContent()).toEqual(undefined);

    dialogue.begin();
    expect(dialogue.getContent()).toEqual(undefined);
  });

  it('use special variable OPTIONS_COUNT as condition', () => {
    const parser = Parser();
    const content = parser.parse(`
>> hello %OPTIONS_COUNT%
      * Yes
        yep
        <-
      * No
        nope
        <-
      { OPTIONS_COUNT > 1 } + What?
        wat
        <-
<<
`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello 3', options: [{ label: 'Yes' },{ label: 'No' }, { label: 'What?' } ] });
    dialogue.choose(2);
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'wat' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello 3', options: [{ label: 'Yes' },{ label: 'No' }, { label: 'What?' } ] });
    dialogue.choose(0)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'yep' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello 2', options: [ { label: 'No' }, { label: 'What?' } ] });

    dialogue.choose(0)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'nope' });
    expect(dialogue.getContent()).toEqual(undefined);
  });

  it('fails when trying to select option when in wrong state', () => {
    const parser = Parser();
    const content = parser.parse('Hi!\n');
    const dialogue = Interpreter(content);
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi!' });

    expect(() => dialogue.choose(0)).toThrow(/Nothing to select./);
  });

  it('fails when selecting wrong index', () => {
    const parser = Parser();
    const content = parser.parse('>> hello $id: 123\n * a\n  aa\n * b\n  ba\n<<\n');
    const dialogue = Interpreter(content);
    expect(dialogue.getContent()).toEqual({ id: '123', type: 'options', name: 'hello', options: [{ label: 'a' }, { label: 'b' } ] });
    expect(() => dialogue.choose(66)).toThrow(/Index 66 not available./);
  });
});


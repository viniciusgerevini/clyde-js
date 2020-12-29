const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('./interpreter');

describe("Interpreter: options", () => {
  it('handle options', () => {
    const parser = Parser();
    const content = parser.parse('\nHey hey\n>> speaker: hello\n  * a\n   aa\n   ab\n  * b $id:abc\n   ba\n   bb\n  + c\n   ca\n   cb\n<<\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hey hey' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b', id: 'abc' }, { label: 'c' } ] });
    dialogue.choose(1)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'ba' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'bb' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });
    dialogue.choose(1)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'ca' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'cb' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });

    dialogue.choose(0)
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'aa' });
    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'ab' });
    expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'c' } ] });
    dialogue.getContent();
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


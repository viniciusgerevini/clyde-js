import { parse } from '@clyde-lang/parser';
import { Interpreter, DialogueLine } from './interpreter';

describe("Interpreter: variations", () => {
  it('sequence: show variations in sequence and return the last one when all used', () => {
    const content = parse(`(sequence\n - Hello!\n - Hi!\n - Hey!\n)\nYep!\n`);
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hello!');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Yep!');

    dialogue.start();

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hi!');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Yep!');

    dialogue.start();

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hey!');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Yep!');

    dialogue.start();

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hey!');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Yep!');
  });

  it('cycle: cycle variations', () => {
    const content = parse(`( cycle\n - Hello!\n - Hi!\n - Hey!\n)\n`);
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hello!');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hi!');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hey!');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hello!');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hi!');
  });

  it('once: execute each alternative once, and skip when none left', () => {
    const content = parse(`( once\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hello!');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hi!');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hey!');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('end');
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('end');
  });

  it('shuffle sequence: run shuffled variations in sequence, sticking with the last one', () => {
    const content = parse(`( shuffle sequence\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    let usedOptions: string[] = [];
    for (let _i in [0, 1, 2]) {
      dialogue.start();
      const option = (dialogue.getContent() as DialogueLine).text
      expect(usedOptions).not.toContain(option);
      usedOptions.push(option);
    }
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual(usedOptions[2]);
    expect(usedOptions.join(',')).not.toEqual('Hello!,Hi!,Hey');
  });

  it('shuffle once: run each alternative once, shuffled, and skip when none left', () => {
    const content = parse(`( shuffle once\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    let usedOptions: string[] = [];
    for (let _i in [0, 1, 2]) {
      dialogue.start();
      const option = (dialogue.getContent() as DialogueLine).text
      expect(usedOptions).not.toContain(option);
      usedOptions.push(option);
    }
    dialogue.start();
    expect((dialogue.getContent() as DialogueLine).text).toEqual('end');
  });

  it('shuffle cycle: show each alternative out of order and then repeat again when finished', () => {
    const content = parse("( shuffle cycle\n - Hello!\n - Hi!\n - Hey!\n)\nend\n");
    const dialogue = Interpreter(content);

    let usedOptions: string[] = [];
    let secondRunUsedOptions: string[] = [];
    for (let _i in [0, 1, 2]) {
      dialogue.start();
      const option = (dialogue.getContent() as DialogueLine).text
      expect(usedOptions).not.toContain(option);
      usedOptions.push(option);
    }

    for (let _i in [0, 1, 2]) {
      dialogue.start();
      const option = (dialogue.getContent() as DialogueLine).text
      expect(secondRunUsedOptions).not.toContain(option);
      secondRunUsedOptions.push(option);
    }
    expect(usedOptions.sort()).toEqual(secondRunUsedOptions.sort());
  });

  describe("real shuffle", () => {
    let mathRandomMock: jest.SpiedFunction<typeof Math.random>;

    beforeEach(() => {
        mathRandomMock = jest.spyOn(global.Math, 'random');
    });

    afterEach(() => {
        jest.spyOn(global.Math, 'random').mockRestore();
    });

    it('shuffle: return one of the variations without guarantee all will be returned', () => {
      const content = parse(`( shuffle\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
      const dialogue = Interpreter(content);

      let randomReturn = [0.1, 0.1, 0.9];
      let expectedReturnOrder = ["Hello!", "Hello!", "Hey!"];
      for (let i of [0, 1, 2]) {
        mathRandomMock.mockReturnValue(randomReturn[i]);
        dialogue.start();
        const variation = (dialogue.getContent() as DialogueLine).text
        expect(variation).toEqual(expectedReturnOrder[i]);
      }
    });
  });


  it('works with conditional variations', () => {
    const content = parse(`(sequence \n - Hello!\n - { someVar } Hi!\n - Hey!\n)\nYep!\n`);
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hello!');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Yep!');

    dialogue.start();

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hey!');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Yep!');

    dialogue.start();

    expect((dialogue.getContent() as DialogueLine).text).toEqual('Hey!');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('Yep!');
  });

  it('works with shuffle and conditional variations', () => {
    const content = parse(`( shuffle cycle\n - { not alreadyRun } Hello! { set alreadyRun = true}\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    let usedOptions: string[] = [];
    let secondRunUsedOptions: string[] = [];
    for (let _i in [0, 1, 2]) {
      dialogue.start();
      usedOptions.push((dialogue.getContent() as DialogueLine).text);
    }
    for (let _i in [0, 1, 2]) {
      dialogue.start();
      secondRunUsedOptions.push((dialogue.getContent() as DialogueLine).text);
    }
    expect(usedOptions).toContain('Hello!');
    expect(secondRunUsedOptions).not.toContain('Hello!');
  });

  it('skip when no condition met', () => {
    const content = parse(`(\n - { a } A\n -  { b } B\n)\nend\n`);
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toContain('end');
  });
});


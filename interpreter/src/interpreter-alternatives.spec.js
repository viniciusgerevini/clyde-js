import { parse } from 'clyde-parser';
import { Interpreter } from './interpreter';

describe("Interpreter: variations", () => {
  it('sequence: show variations in sequence and return the last one when all used', () => {
    const content = parse(`(sequence\n - Hello!\n - Hi!\n - Hey!\n)\nYep!\n`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('Hello!');
    expect(dialogue.getContent().text).toEqual('Yep!');

    dialogue.begin();

    expect(dialogue.getContent().text).toEqual('Hi!');
    expect(dialogue.getContent().text).toEqual('Yep!');

    dialogue.begin();

    expect(dialogue.getContent().text).toEqual('Hey!');
    expect(dialogue.getContent().text).toEqual('Yep!');

    dialogue.begin();

    expect(dialogue.getContent().text).toEqual('Hey!');
    expect(dialogue.getContent().text).toEqual('Yep!');
  });

  it('cycle: cycle variations', () => {
    const content = parse(`( cycle\n - Hello!\n - Hi!\n - Hey!\n)\n`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('Hello!');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('Hi!');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('Hey!');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('Hello!');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('Hi!');
  });

  it('once: execute each alternative once, and skip when none left', () => {
    const content = parse(`( once\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('Hello!');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('Hi!');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('Hey!');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('end');
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('end');
  });

  test.each(['shuffle', 'shuffle sequence'])('%s: run shuffled variations in sequence, sticking with the last one', (mode) => {
    const content = parse(`( ${mode}\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    let usedOptions = [];
    for (let _i in [0, 1, 2]) {
      dialogue.begin();
      const option = dialogue.getContent().text
      expect(usedOptions).not.toContain(option);
      usedOptions.push(option);
    }
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual(usedOptions[2]);
    expect(usedOptions.join(',')).not.toEqual('Hello!,Hi!,Hey');
  });

  it('shuffle once: run each alternative once, shuffled, and skip when none left', () => {
    const content = parse(`( shuffle once\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    let usedOptions = [];
    for (let _i in [0, 1, 2]) {
      dialogue.begin();
      const option = dialogue.getContent().text
      expect(usedOptions).not.toContain(option);
      usedOptions.push(option);
    }
    dialogue.begin();
    expect(dialogue.getContent().text).toEqual('end');
  });

  it('shuffle cycle: show each alternative out of order and then repeat again when finished.', () => {
    const content = parse(`( shuffle cycle\n - Hello!\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    let usedOptions = [];
    let secondRunUsedOptions = [];
    for (let _i in [0, 1, 2]) {
      dialogue.begin();
      const option = dialogue.getContent().text
      expect(usedOptions).not.toContain(option);
      usedOptions.push(option);
    }

    for (let _i in [0, 1, 2]) {
      dialogue.begin();
      const option = dialogue.getContent().text
      expect(secondRunUsedOptions).not.toContain(option);
      secondRunUsedOptions.push(option);
    }
    expect(usedOptions.sort()).toEqual(secondRunUsedOptions.sort());
  });

  it('works with conditional variations', () => {
    const content = parse(`( sequence\n - Hello!\n - { someVar } Hi!\n - Hey!\n)\nYep!\n`);
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('Hello!');
    expect(dialogue.getContent().text).toEqual('Yep!');

    dialogue.begin();

    expect(dialogue.getContent().text).toEqual('Hey!');
    expect(dialogue.getContent().text).toEqual('Yep!');

    dialogue.begin();

    expect(dialogue.getContent().text).toEqual('Hey!');
    expect(dialogue.getContent().text).toEqual('Yep!');
  });

  it('works with shuffle and conditional variations', () => {
    const content = parse(`( shuffle cycle\n - { not alreadyRun } Hello! { set alreadyRun = true}\n - Hi!\n - Hey!\n)\nend\n`);
    const dialogue = Interpreter(content);

    let usedOptions = [];
    let secondRunUsedOptions = [];
    for (let _i in [0, 1, 2]) {
      dialogue.begin();
      usedOptions.push(dialogue.getContent().text);
    }
    for (let _i in [0, 1, 2]) {
      dialogue.begin();
      secondRunUsedOptions.push(dialogue.getContent().text);
    }
    expect(usedOptions).toContain('Hello!');
    expect(secondRunUsedOptions).not.toContain('Hello!');
  });
});


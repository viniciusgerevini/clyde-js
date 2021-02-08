import { parse } from 'clyde-parser';
import { Interpreter } from './interpreter';

describe("Interpreter: blocks and diverts", () => {
  describe('blocks', () => {
    it('do not execute blocks by default', () => {
      const content = parse('Hello!\nHi there.\n== some_block\nHello from the block!\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hello!' });
      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hi there.' });
      expect(dialogue.getContent()).toEqual(undefined);
    });

    it('execute block by name', () => {
      const content = parse('Hello!\nHi there.\n== some_block\nHello from the block!\n== some_other_block\nHello from the other block!\n');
      const dialogue = Interpreter(content);

      dialogue.start('some_block');

      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hello from the block!' });
      expect(dialogue.getContent()).toEqual(undefined);

      dialogue.start('some_other_block');

      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hello from the other block!' });
      expect(dialogue.getContent()).toEqual(undefined);

      dialogue.start();

      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hello!' });
      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hi there.' });
      expect(dialogue.getContent()).toEqual(undefined);
    });
  });

  describe('diverts', () => {
    it('divert flow to named block', () => {
      const content = parse(`
Hello!
Let's go to another block
-> another_block
this line won't be executed

== another_block
this is another block

`);
      const dialogue = Interpreter(content);

      dialogue.start();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().text).toEqual("Let's go to another block");
      expect(dialogue.getContent().text).toEqual('this is another block');
      expect(dialogue.getContent()).toEqual(undefined);
    });

    it('divert back to parent', () => {
      const content = parse(`
Hello!
Let's go to another block
-> another_block
this line should be called after block

== another_block
this is another block
<-

`);
      const dialogue = Interpreter(content);

      dialogue.start();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().text).toEqual("Let's go to another block");
      expect(dialogue.getContent().text).toEqual('this is another block');
      expect(dialogue.getContent().text).toEqual('this line should be called after block');
      expect(dialogue.getContent()).toEqual(undefined);
    });

    it('divert from block to options list', () => {
      const content = parse(`
Hello!
question
  * [yes]
    -> yes_answer
    continue
  * [no]
    -> no_answer
end

== yes_answer
yes a!
<-

== no_answer
no a!
<-
`);
      const dialogue = Interpreter(content);

      dialogue.start();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().name).toEqual("question");
      dialogue.choose(0);
      expect(dialogue.getContent().text).toEqual('yes a!');
      expect(dialogue.getContent().text).toEqual('continue');
      expect(dialogue.getContent().text).toEqual('end');
    });

    it('divert back to options', () => {
      const content = parse(`
Hello!
question
  * [yes]
    -> yes_answer
    continue
    <-
  * [no]
    -> no_answer
end

== yes_answer
yes a!
<-

== no_answer
no a!
<-
`);
      const dialogue = Interpreter(content);

      dialogue.start();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().name).toEqual("question");
      dialogue.choose(0);
      expect(dialogue.getContent().text).toEqual('yes a!');
      expect(dialogue.getContent().text).toEqual('continue');
      expect(dialogue.getContent().name).toEqual("question");
    });

    it('end dialogue', () => {
      const content = parse(`
Hello!
-> END
this will never be seeing
`);
      const dialogue = Interpreter(content);

      dialogue.start();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent()).toEqual(undefined);
      expect(dialogue.getContent()).toEqual(undefined);
    });

    it('does not fail when divert to parent in the root node', () => {
      const content = parse(`
Hello!
<-
`);
      const dialogue = Interpreter(content);

      dialogue.start();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent()).toEqual(undefined);
    });
  });
});


const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('./interpreter');

describe("Interpreter: blocks and diverts", () => {
  describe('blocks', () => {
    it('do not execute blocks by default', () => {
      const parser = Parser();
      const content = parser.parse('Hello!\nHi there.\n== some_block\nHello from the block!\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello!' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi there.' });
      expect(dialogue.getContent()).toEqual(undefined);
    });

    it('execute block by name', () => {
      const parser = Parser();
      const content = parser.parse('Hello!\nHi there.\n== some_block\nHello from the block!\n== some_other_block\nHello from the other block!\n');
      const dialogue = Interpreter(content);

      dialogue.begin('some_block');

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello from the block!' });
      expect(dialogue.getContent()).toEqual(undefined);

      dialogue.begin('some_other_block');

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello from the other block!' });
      expect(dialogue.getContent()).toEqual(undefined);

      dialogue.begin();

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello!' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi there.' });
      expect(dialogue.getContent()).toEqual(undefined);
    });
  });

  describe('diverts', () => {
    it('divert flow to named block', () => {
      const parser = Parser();
      const content = parser.parse(`
Hello!
Let's go to another block
-> another_block
this line won't be executed

== another_block
this is another block

`);
      const dialogue = Interpreter(content);

      dialogue.begin();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().text).toEqual("Let's go to another block");
      expect(dialogue.getContent().text).toEqual('this is another block');
      expect(dialogue.getContent()).toEqual(undefined);
    });

    it('divert back to parent', () => {
      const parser = Parser();
      const content = parser.parse(`
Hello!
Let's go to another block
-> another_block
this line should be called after block

== another_block
this is another block
<-

`);
      const dialogue = Interpreter(content);

      dialogue.begin();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().text).toEqual("Let's go to another block");
      expect(dialogue.getContent().text).toEqual('this is another block');
      expect(dialogue.getContent().text).toEqual('this line should be called after block');
      expect(dialogue.getContent()).toEqual(undefined);
    });

    it('divert from block to options list', () => {
      const parser = Parser();
      const content = parser.parse(`
Hello!
>> question
  * yes
    -> yes_answer
    continue
  * no
    -> no_answer
<<
end

== yes_answer
yes a!
<-

== no_answer
no a!
<-
`);
      const dialogue = Interpreter(content);

      dialogue.begin();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().name).toEqual("question");
      dialogue.choose(0);
      expect(dialogue.getContent().text).toEqual('yes a!');
      expect(dialogue.getContent().text).toEqual('continue');
      expect(dialogue.getContent().text).toEqual('end');
    });

    it('divert back to options', () => {
      const parser = Parser();
      const content = parser.parse(`
Hello!
>> question
  * yes
    -> yes_answer
    continue
    <-
  * no
    -> no_answer
<<
end

== yes_answer
yes a!
<-

== no_answer
no a!
<-
`);
      const dialogue = Interpreter(content);

      dialogue.begin();

      expect(dialogue.getContent().text).toEqual('Hello!');
      expect(dialogue.getContent().name).toEqual("question");
      dialogue.choose(0);
      expect(dialogue.getContent().text).toEqual('yes a!');
      expect(dialogue.getContent().text).toEqual('continue');
      expect(dialogue.getContent().name).toEqual("question");
    });
  });
});


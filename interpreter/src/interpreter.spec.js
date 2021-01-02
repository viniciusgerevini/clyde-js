import { Parser } from 'clyde-transpiler';
import { Interpreter } from './interpreter';

/*
* TODO
* - [ ] events: dialogue_ended, variable_changed
* - [ ] language stuff
*   -- to be able to notify end or knowing if there is next I'll have to perform pop on last item, and not after that
*/

describe("Interpreter", () => {
  describe('lines', () => {
    it('get lines', () => {
      const parser = Parser();
      const content = parser.parse('Hello!\nHi there.\nHey.|tag|\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello!' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi there.' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hey.', tags: ['tag']});
    });

    it('get lines with details', () => {
      const parser = Parser();
      const content = parser.parse('speaker1: Hello! $id: 123\nspeaker2: Hi there. $id: abc\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello!', speaker: 'speaker1', id: '123'});
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi there.', speaker: 'speaker2', id: 'abc' });
    });
  });

  describe('Events', () => {
    it('trigger event on variable changed', (done) => {
      const parser = Parser();
      const content = parser.parse('Hi!{ set something = 123 }\n');
      const dialogue = Interpreter(content);

      dialogue.on(dialogue.events.VARIABLE_CHANGED, (data) => {
        expect(data).toEqual({ name:'something', value: 123 });
        done();
      });

      dialogue.getContent()
    });

    it('remove listener', (done) => {
      const parser = Parser();
      const content = parser.parse('Hi!{ set something = 123 }\n');
      const dialogue = Interpreter(content);

      const callback = dialogue.on(dialogue.events.VARIABLE_CHANGED, () => {
        throw new Error('should not have triggered listener');
      });

      dialogue.off(dialogue.events.VARIABLE_CHANGED, callback);

      dialogue.getContent()

      setTimeout(() => done(), 100);
    });
  });

  describe('persistence', () => {
    it('get all data and start new instance with right state', () =>{
      const parser = Parser();
      const content = parser.parse(`
>>
  * a
    Hi!{ set someVar = 1 }
  * b
    hello %someVar%
<<
`);
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'a' }, { label: 'b' }] });
      dialogue.choose(0);
      expect(dialogue.getContent().text).toEqual('Hi!');

      const newDialogue = Interpreter(content, dialogue.getData());

      expect(newDialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'b' }] });
      newDialogue.choose(0);
      expect(newDialogue.getContent().text).toEqual('hello 1');
    });

    it('get all data and load in another instance', () =>{
      const parser = Parser();
      const content = parser.parse(`
>>
  * a
    set as 1!{ set someVar = 1 }
  * b
    set as 2!{ set someVar = 2 }
<<
result is %someVar%
`);
      const dialogue = Interpreter(content);
      const anotherDialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'a' }, { label: 'b' }] });
      expect(anotherDialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'a' }, { label: 'b' }] });
      dialogue.choose(0);
      anotherDialogue.choose(1);
      expect(dialogue.getContent().text).toEqual('set as 1!');
      expect(anotherDialogue.getContent().text).toEqual('set as 2!');

      anotherDialogue.loadData(dialogue.getData());

      expect(anotherDialogue.getContent().text).toEqual('result is 1');
    });
  });

  describe('End of dialogue', () => {
    it('get undefined when not more lines left', () => {
      const parser = Parser();
      const content = parser.parse('Hi!\n');
      const dialogue = Interpreter(content);
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi!' });
      expect(dialogue.getContent()).toBe(undefined);
      expect(dialogue.getContent()).toBe(undefined);
    });
  });


  describe('Unknowns', () => {
    it('fails when unkown node type detected', () => {
      const parser = Parser();
      const content = parser.parse('Hi!\n');
      content.type = 'SomeUnkownNode';
      const dialogue = Interpreter(content);

      expect(() => dialogue.getContent()).toThrow(/Unkown node type "SomeUnkownNode"/);
    });
  });
});


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


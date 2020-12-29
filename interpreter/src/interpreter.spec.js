const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('./interpreter');

/*
* TODO
* - [ ] blocks (== this_is_a_block)
* - [ ] block divert (`-> block_name`)
* - [ ] parent divert (`<-`). Goes to parent block, option list, or divert
* - [ ] anchors, like in `(some_anchor)`, where we can divert like this `> some_anchor`
* - [ ] line tags
* - [ ] events: dialogue_ended, variable_changed
* - [ ] language stuff
*   [ ] OPTION count
*   [ ] fix options behavior. If no divert in the end, it continues flow without going back to topic
*   -- to be able to notify end or knowing if there is next I'll have to perform pop on last item, and not after that
*/

describe("Interpreter", () => {
  describe('lines', () => {
    it('get lines', () => {
      const parser = Parser();
      const content = parser.parse('Hello!\nHi there.\nHey.\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello!' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi there.' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hey.' });
    });

    it('get lines with details', () => {
      const parser = Parser();
      const content = parser.parse('speaker1: Hello! $id: 123\nspeaker2: Hi there. $id: abc\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hello!', speaker: 'speaker1', id: '123'});
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi there.', speaker: 'speaker2', id: 'abc' });
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


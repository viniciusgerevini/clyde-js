const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('./interpreter');

/*
* TODO
* - [x] lines
* - [x] line id (`this is a line $id: hey`)
* - [x] speaker (speaker: this is a line)
* - [x] topic block (`>>`)
* - [x] topic block with description line (`>> some line here`)
* - [x] sticky topic (`+`)
* - [ ] topic title speaker and id
* - [ ] set variables (`{ set var=true }`)
* - [ ] conditional lines (`{ is_first_run && speaker_hp > 10 }`)
* - [ ] blocks (== this_is_a_block)
* - [ ] block divert (`-> block_name`)
* - [ ] parent divert (`<-`). Goes to parent block, topic list, or divert
* - [ ] anchors, like in `(some_anchor)`, where we can divert like this `> some_anchor`
* - [ ] alternatives with mode: sequence, only one, execute once each, execute cycle, execute random (`!!sequence`)
* - [ ] topic name id
* - [ ] line tags
* - [ ] events: dialog_ended, variable_changed
* - [ ] language stuff
*/

describe("Interpreter", () => {
  describe('lines', () => {
    it('get lines', () => {
      const parser = Parser();
      const content = parser.parse('Hello!\nHi there.\nHey.\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hello!' });
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hi there.' });
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hey.' });
    });

    it('get lines with details', () => {
      const parser = Parser();
      const content = parser.parse('speaker1: Hello! $id: 123\nspeaker2: Hi there. $id: abc\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hello!', speaker: 'speaker1', id: '123'});
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hi there.', speaker: 'speaker2', id: 'abc' });
    });
  });

  describe('topics', () => {
    it('handle topics', () => {
      const parser = Parser();
      const content = parser.parse('\nHey hey\n>> speaker: hello\n  * a\n   aa\n   ab\n  * b\n   ba\n   bb\n  + c\n   ca\n   cb\n<<\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hey hey' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'speaker: hello', topics: [{ label: 'a' },{ label: 'b' }, { label: 'c' } ] });
      dialog.choose(1)
      expect(dialog.getContent()).toEqual({ type: 'dialog',  text: 'ba' });
      expect(dialog.getContent()).toEqual({ type: 'dialog',  text: 'bb' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'speaker: hello', topics: [{ label: 'a' }, { label: 'c' } ] });
      dialog.choose(1)
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'ca' });
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'cb' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'speaker: hello', topics: [{ label: 'a' }, { label: 'c' } ] });

      dialog.choose(0)
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'aa' });
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'ab' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'speaker: hello', topics: [{ label: 'c' } ] });
    });

    it('fails when trying to select topic when in wrong state', () => {
      const parser = Parser();
      const content = parser.parse('Hi!\n');
      const dialog = Interpreter(content);
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hi!' });

      expect(() => dialog.choose(0)).toThrow(/Nothing to select./);
    });

    it('fails when selecting wrong index', () => {
      const parser = Parser();
      const content = parser.parse(`>> speaker: hello\n * a\n  aa\n * b\n  ba\n<<\n`);
      const dialog = Interpreter(content);
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'speaker: hello', topics: [{ label: 'a' }, { label: 'b' } ] });
      expect(() => dialog.choose(66)).toThrow(/Index 66 not available./);
    });

  });

  describe('End of dialog', () => {
    it('get undefined when not more lines left', () => {
      const parser = Parser();
      const content = parser.parse('Hi!\n');
      const dialog = Interpreter(content);
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hi!' });
      expect(dialog.getContent()).toBe(undefined);
      expect(dialog.getContent()).toBe(undefined);
    });
  });
});


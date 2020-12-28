const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('./interpreter');

/*
* TODO
* - [ ] conditional lines (`{ is_first_run && speaker_hp > 10 }`)
* - [ ] blocks (== this_is_a_block)
* - [ ] block divert (`-> block_name`)
* - [ ] parent divert (`<-`). Goes to parent block, option list, or divert
* - [ ] anchors, like in `(some_anchor)`, where we can divert like this `> some_anchor`
* - [ ] alternatives with mode: sequence, only one, execute once each, execute cycle, execute random (`!!sequence`)
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

  describe('options', () => {
    it('handle options', () => {
      const parser = Parser();
      const content = parser.parse('\nHey hey\n>> speaker: hello\n  * a\n   aa\n   ab\n  * b $id:abc\n   ba\n   bb\n  + c\n   ca\n   cb\n<<\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hey hey' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b', id: 'abc' }, { label: 'c' } ] });
      dialog.choose(1)
      expect(dialog.getContent()).toEqual({ type: 'dialog',  text: 'ba' });
      expect(dialog.getContent()).toEqual({ type: 'dialog',  text: 'bb' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });
      dialog.choose(1)
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'ca' });
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'cb' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });

      dialog.choose(0)
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'aa' });
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'ab' });
      expect(dialog.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'c' } ] });
    });

    it('fails when trying to select option when in wrong state', () => {
      const parser = Parser();
      const content = parser.parse('Hi!\n');
      const dialog = Interpreter(content);
      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'Hi!' });

      expect(() => dialog.choose(0)).toThrow(/Nothing to select./);
    });

    it('fails when selecting wrong index', () => {
      const parser = Parser();
      const content = parser.parse('>> hello $id: 123\n * a\n  aa\n * b\n  ba\n<<\n');
      const dialog = Interpreter(content);
      expect(dialog.getContent()).toEqual({ id: '123', type: 'options', name: 'hello', options: [{ label: 'a' }, { label: 'b' } ] });
      expect(() => dialog.choose(66)).toThrow(/Index 66 not available./);
    });

  });

  describe('variables', () => {
    it('set variables', () => {
      const parser = Parser();
      const content = parser.parse('lets set a variable {set something="the"}\nthis is %something% variable\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent().text).toEqual('lets set a variable');
      expect(dialog.getContent().text).toEqual('this is the variable');
    });

    it('set variables with right type', () => {
      const parser = Parser();
      const content = parser.parse('a {set a="s", b=true, c=123}\nresults %a% %b% %c%\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent().text).toEqual('a');
      expect(dialog.getContent().text).toEqual('results s true 123');
      expect(typeof dialog.getVariable('a')).toBe("string");
      expect(typeof dialog.getVariable('b')).toBe("boolean");
      expect(typeof dialog.getVariable('c')).toBe("number");
    });

    it('set variables with right type', () => {
      const parser = Parser();
      const content = parser.parse('a {set a="value of a", b=a}\n%b%\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent().text).toEqual('a');
      expect(dialog.getContent().text).toEqual('value of a');
    });

    it('make complex assignements', () => {
      const parser = Parser();
      const content = parser.parse('a {set a=1, a += 5, b = c = a, b -=1}\na %a% b %b% c %c%\n');
      const dialog = Interpreter(content);

      expect(dialog.getContent().text).toEqual('a');
      expect(dialog.getContent().text).toEqual('a 6 b 5 c 6');
    });

    it('set variables externally', () => {
      const parser = Parser();
      const content = parser.parse('vars %id% %name%\nvars %id% %name%\n');
      const dialog = Interpreter(content);

      dialog.setVariable('id', 'some_id');
      dialog.setVariable('name', 'some name');

      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'vars some_id some name' });

      dialog.setVariable('id', 'some other id');

      expect(dialog.getContent()).toEqual({ type: 'dialog', text: 'vars some other id some name' });
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


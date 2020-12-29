const { Parser } = require('clyde-transpiler');
const { Interpreter } = require('./interpreter');

/*
* TODO
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

    it('assign variables to other variables', () => {
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

    it('perform operations', () => {
      const parser = Parser();
      const content = parser.parse(`
start {set a = 100}
multiply {set b = a * 2 }
divide {set c = a / 2 }
subtract {set d = a - 10 }
add {set e = b + c }
power {set e = a ^ 2 }
mod {set e = 100 % 2 }
`
      );
      const dialog = Interpreter(content);

      expect(dialog.getContent().text).toEqual('start');
      expect(dialog.getVariable('a')).toBe(100);
      expect(dialog.getContent().text).toEqual('multiply');
      expect(dialog.getVariable('b')).toBe(200);
      expect(dialog.getContent().text).toEqual('divide');
      expect(dialog.getVariable('c')).toBe(50);
      expect(dialog.getContent().text).toEqual('subtract');
      expect(dialog.getVariable('d')).toBe(90);
      expect(dialog.getContent().text).toEqual('add');
      expect(dialog.getVariable('e')).toBe(250);
      expect(dialog.getContent().text).toEqual('power');
      expect(dialog.getVariable('e')).toBe(10000);
      expect(dialog.getContent().text).toEqual('mod');
      expect(dialog.getVariable('e')).toBe(0);
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

  describe('conditions', () => {
    it('show only lines that meet the criteria', () => {
      const parser = Parser();
      const content = parser.parse(`
Start with hp 100 {set hp = 100}
{ hp > 90 } you should see this line.
Set hp 90. {set hp = 90}
{ hp > 90 } you should not see this line.
{ hp >= 90 } but you should see this line.
{ hp < 90 } you should not see this line here.
{ hp <= 90 } but you should see this other line.
{ hp == 90 } and also this line.
{ hp != 90 } but not his one.
{ hp == 90 and hp is 90 } this one.
{ hp isnt 90 or hp is 90 } and this one.
{ hp isnt 90 } maybe this one.
{ hp == 90 and hp is 90 } and this one for sure. {set goodbye = true}
{ goodbye } Almost there!
{ not goodbye and goodbye } Almost...
{ hp / 2 == 45 } It accepts mafs
I believe this is all
`
      );
      const dialog = Interpreter(content);

      expect(dialog.getContent().text).toEqual('Start with hp 100');
      expect(dialog.getContent().text).toEqual('you should see this line.');
      expect(dialog.getContent().text).toEqual('Set hp 90.');
      expect(dialog.getContent().text).toEqual('but you should see this line.');
      expect(dialog.getContent().text).toEqual('but you should see this other line.');
      expect(dialog.getContent().text).toEqual('and also this line.');
      expect(dialog.getContent().text).toEqual('this one.');
      expect(dialog.getContent().text).toEqual('and this one.');
      expect(dialog.getContent().text).toEqual('and this one for sure.');
      expect(dialog.getContent().text).toEqual('Almost there!');
      expect(dialog.getContent().text).toEqual('It accepts mafs');
      expect(dialog.getContent().text).toEqual('I believe this is all');
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

  describe('Unknowns', () => {
    it('fails when unkown node type detected', () => {
      const parser = Parser();
      const content = parser.parse('Hi!\n');
      content.type = 'SomeUnkownNode';
      const dialog = Interpreter(content);

      expect(() => dialog.getContent()).toThrow(/Unkown node type "SomeUnkownNode"/);
    });
  });
});


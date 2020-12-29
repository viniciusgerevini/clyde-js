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

  describe('options', () => {
    it('handle options', () => {
      const parser = Parser();
      const content = parser.parse('\nHey hey\n>> speaker: hello\n  * a\n   aa\n   ab\n  * b $id:abc\n   ba\n   bb\n  + c\n   ca\n   cb\n<<\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hey hey' });
      expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' },{ label: 'b', id: 'abc' }, { label: 'c' } ] });
      dialogue.choose(1)
      expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'ba' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue',  text: 'bb' });
      expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });
      dialogue.choose(1)
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'ca' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'cb' });
      expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'a' }, { label: 'c' } ] });

      dialogue.choose(0)
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'aa' });
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'ab' });
      expect(dialogue.getContent()).toEqual({ type: 'options', name: 'hello', speaker: 'speaker', options: [{ label: 'c' } ] });
      dialogue.getContent();
    });

    it('fails when trying to select option when in wrong state', () => {
      const parser = Parser();
      const content = parser.parse('Hi!\n');
      const dialogue = Interpreter(content);
      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'Hi!' });

      expect(() => dialogue.choose(0)).toThrow(/Nothing to select./);
    });

    it('fails when selecting wrong index', () => {
      const parser = Parser();
      const content = parser.parse('>> hello $id: 123\n * a\n  aa\n * b\n  ba\n<<\n');
      const dialogue = Interpreter(content);
      expect(dialogue.getContent()).toEqual({ id: '123', type: 'options', name: 'hello', options: [{ label: 'a' }, { label: 'b' } ] });
      expect(() => dialogue.choose(66)).toThrow(/Index 66 not available./);
    });

  });

  describe('variables', () => {
    it('set variables', () => {
      const parser = Parser();
      const content = parser.parse('lets set a variable {set something="the"}\nthis is %something% variable\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent().text).toEqual('lets set a variable');
      expect(dialogue.getContent().text).toEqual('this is the variable');
    });

    it('set variables with right type', () => {
      const parser = Parser();
      const content = parser.parse('a {set a="s", b=true, c=123}\nresults %a% %b% %c%\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent().text).toEqual('a');
      expect(dialogue.getContent().text).toEqual('results s true 123');
      expect(typeof dialogue.getVariable('a')).toBe("string");
      expect(typeof dialogue.getVariable('b')).toBe("boolean");
      expect(typeof dialogue.getVariable('c')).toBe("number");
    });

    it('assign variables to other variables', () => {
      const parser = Parser();
      const content = parser.parse('a {set a="value of a", b=a}\n%b%\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent().text).toEqual('a');
      expect(dialogue.getContent().text).toEqual('value of a');
    });

    it('make complex assignements', () => {
      const parser = Parser();
      const content = parser.parse('a {set a=1, a += 5, b = c = a, b -=1}\na %a% b %b% c %c%\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent().text).toEqual('a');
      expect(dialogue.getContent().text).toEqual('a 6 b 5 c 6');
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
      const dialogue = Interpreter(content);

      expect(dialogue.getContent().text).toEqual('start');
      expect(dialogue.getVariable('a')).toBe(100);
      expect(dialogue.getContent().text).toEqual('multiply');
      expect(dialogue.getVariable('b')).toBe(200);
      expect(dialogue.getContent().text).toEqual('divide');
      expect(dialogue.getVariable('c')).toBe(50);
      expect(dialogue.getContent().text).toEqual('subtract');
      expect(dialogue.getVariable('d')).toBe(90);
      expect(dialogue.getContent().text).toEqual('add');
      expect(dialogue.getVariable('e')).toBe(250);
      expect(dialogue.getContent().text).toEqual('power');
      expect(dialogue.getVariable('e')).toBe(10000);
      expect(dialogue.getContent().text).toEqual('mod');
      expect(dialogue.getVariable('e')).toBe(0);
    });

    it('set variables externally', () => {
      const parser = Parser();
      const content = parser.parse('vars %id% %name%\nvars %id% %name%\n');
      const dialogue = Interpreter(content);

      dialogue.setVariable('id', 'some_id');
      dialogue.setVariable('name', 'some name');

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'vars some_id some name' });

      dialogue.setVariable('id', 'some other id');

      expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'vars some other id some name' });
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
      const dialogue = Interpreter(content);

      expect(dialogue.getContent().text).toEqual('Start with hp 100');
      expect(dialogue.getContent().text).toEqual('you should see this line.');
      expect(dialogue.getContent().text).toEqual('Set hp 90.');
      expect(dialogue.getContent().text).toEqual('but you should see this line.');
      expect(dialogue.getContent().text).toEqual('but you should see this other line.');
      expect(dialogue.getContent().text).toEqual('and also this line.');
      expect(dialogue.getContent().text).toEqual('this one.');
      expect(dialogue.getContent().text).toEqual('and this one.');
      expect(dialogue.getContent().text).toEqual('and this one for sure.');
      expect(dialogue.getContent().text).toEqual('Almost there!');
      expect(dialogue.getContent().text).toEqual('It accepts mafs');
      expect(dialogue.getContent().text).toEqual('I believe this is all');
    });
  });

  describe('alternatives', () => {
    it('sequence: show alternatives in sequence and return the last one when all used', () => {
      const parser = Parser();
      const content = parser.parse(`[\n Hello!\n Hi!\n Hey!\n]\nYep!\n`);
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

    it('cycle: cycle alternatives', () => {
      const parser = Parser();
      const content = parser.parse(`[ cycle\n Hello!\n Hi!\n Hey!\n]\n`);
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
      const parser = Parser();
      const content = parser.parse(`[ once\n Hello!\n Hi!\n Hey!\n]\nend\n`);
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

    test.each(['shuffle', 'shuffle sequence'])('%s: run shuffled alternatives in sequence, sticking with the last one', (mode) => {
      const parser = Parser();
      const content = parser.parse(`[ ${mode}\n Hello!\n Hi!\n Hey!\n]\nend\n`);
      const dialogue = Interpreter(content);

      let usedOptions = [];
      for (let i in [0, 1, 2]) {
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
      const parser = Parser();
      const content = parser.parse(`[ shuffle once\n Hello!\n Hi!\n Hey!\n]\nend\n`);
      const dialogue = Interpreter(content);

      let usedOptions = [];
      for (let i in [0, 1, 2]) {
        dialogue.begin();
        const option = dialogue.getContent().text
        expect(usedOptions).not.toContain(option);
        usedOptions.push(option);
      }
      dialogue.begin();
      expect(dialogue.getContent().text).toEqual('end');
    });

    it('shuffle cycle: show each alternative out of order and then repeat again when finished.', () => {
      const parser = Parser();
      const content = parser.parse(`[ shuffle cycle\n Hello!\n Hi!\n Hey!\n]\nend\n`);
      const dialogue = Interpreter(content);

      let usedOptions = [];
      let secondRunUsedOptions = [];
      for (let i in [0, 1, 2]) {
        dialogue.begin();
        const option = dialogue.getContent().text
        expect(usedOptions).not.toContain(option);
        usedOptions.push(option);
      }

      for (let i in [0, 1, 2]) {
        dialogue.begin();
        const option = dialogue.getContent().text
        expect(secondRunUsedOptions).not.toContain(option);
        secondRunUsedOptions.push(option);
      }
      expect(usedOptions.sort()).toEqual(secondRunUsedOptions.sort());
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


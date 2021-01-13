'use strict';
const { Parser } = require('clyde-parser');
const { Interpreter } = require('./interpreter');

describe("Interpreter: variables", () => {
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

  it('prints undefined variables as ""', () => {
    const parser = Parser();
    const content = parser.parse('var %id% here\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'var  here' });
  });
});


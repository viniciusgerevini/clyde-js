import { parse } from 'clyde-parser';
import { Interpreter } from './interpreter';

describe("Interpreter: variables", () => {
  it('set variables', () => {
    const content = parse('lets set a variable {set something="the"}\nthis is %something% variable\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('lets set a variable');
    expect(dialogue.getContent().text).toEqual('this is the variable');
  });

  it('set variables with right type', () => {
    const content = parse('a {set a="s", b=true, c=123}\nresults %a% %b% %c%\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('a');
    expect(dialogue.getContent().text).toEqual('results s true 123');
    expect(typeof dialogue.getVariable('a')).toBe("string");
    expect(typeof dialogue.getVariable('b')).toBe("boolean");
    expect(typeof dialogue.getVariable('c')).toBe("number");
  });

  it('assign variables to other variables', () => {
    const content = parse('a {set a="value of a", b=a}\n%b%\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('a');
    expect(dialogue.getContent().text).toEqual('value of a');
  });

  it('make complex assignements', () => {
    const content = parse('a {set a=1, a += 5, b = c = a, b -= 1 }\na %a% b %b% c %c%\n');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent().text).toEqual('a');
    expect(dialogue.getContent().text).toEqual('a 6 b 5 c 6');
  });

  it('perform operations', () => {
    const content = parse(`
start {set a = 100}
multiply {set b = a * 2 }
divide {set c = a / 2 }
subtract {set d = a - 10 }
add {set e = b + c }
power {set e = a ^ 2 }
mod {set e = 100 % 2 }
sum assignment { set a += 50 }
sub assignment { set a -= 50 }
mult assignment { set a *= 2 }
div assignment { set a /= 2 }
pow assignment { set a ^= 2 }
mod assignment { set a %= 2 }
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
    expect(dialogue.getContent().text).toEqual('sum assignment');
    expect(dialogue.getVariable('a')).toBe(150);
    expect(dialogue.getContent().text).toEqual('sub assignment');
    expect(dialogue.getVariable('a')).toBe(100);
    expect(dialogue.getContent().text).toEqual('mult assignment');
    expect(dialogue.getVariable('a')).toBe(200);
    expect(dialogue.getContent().text).toEqual('div assignment');
    expect(dialogue.getVariable('a')).toBe(100);
    expect(dialogue.getContent().text).toEqual('pow assignment');
    expect(dialogue.getVariable('a')).toBe(10000);
    expect(dialogue.getContent().text).toEqual('mod assignment');
    expect(dialogue.getVariable('a')).toBe(0);
  });

  it('set variables externally', () => {
    const content = parse('vars %id% %name%\nvars %id% %name%\n');
    const dialogue = Interpreter(content);

    dialogue.setVariable('id', 'some_id');
    dialogue.setVariable('name', 'some name');

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'vars some_id some name' });

    dialogue.setVariable('id', 'some other id');

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'vars some other id some name' });
  });

  it('prints undefined variables as ""', () => {
    const content = parse('var %id% here');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'dialogue', text: 'var  here' });
  });
});


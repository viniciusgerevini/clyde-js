import { parse } from '@clyde-lang/parser';
import { Interpreter, DialogueLine } from './interpreter';

describe("Interpreter: variables", () => {
  it('set variables', () => {
    const content = parse('lets set a variable {set something="the"}\nthis is %something% variable\n');
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('lets set a variable');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this is the variable');
  });

  it('set variables with right type', () => {
    const content = parse('a {set a="s", b=true, c=123}\nresults %a% %b% %c%\n');
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('a');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('results s true 123');
    expect(typeof dialogue.getVariable('a')).toBe("string");
    expect(typeof dialogue.getVariable('b')).toBe("boolean");
    expect(typeof dialogue.getVariable('c')).toBe("number");
  });

  it('assign variables to other variables', () => {
    const content = parse('a {set a="value of a", b=a}\n%b%\n');
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('a');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('value of a');
  });

  it('make complex assignements', () => {
    const content = parse('a {set a=1, a += 5, b = c = a, b -= 1 }\na %a% b %b% c %c%\n');
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('a');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('a 6 b 5 c 6');
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

    expect((dialogue.getContent() as DialogueLine).text).toEqual('start');
    expect(dialogue.getVariable('a')).toBe(100);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('multiply');
    expect(dialogue.getVariable('b')).toBe(200);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('divide');
    expect(dialogue.getVariable('c')).toBe(50);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('subtract');
    expect(dialogue.getVariable('d')).toBe(90);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('add');
    expect(dialogue.getVariable('e')).toBe(250);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('power');
    expect(dialogue.getVariable('e')).toBe(10000);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('mod');
    expect(dialogue.getVariable('e')).toBe(0);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('sum assignment');
    expect(dialogue.getVariable('a')).toBe(150);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('sub assignment');
    expect(dialogue.getVariable('a')).toBe(100);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('mult assignment');
    expect(dialogue.getVariable('a')).toBe(200);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('div assignment');
    expect(dialogue.getVariable('a')).toBe(100);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('pow assignment');
    expect(dialogue.getVariable('a')).toBe(10000);
    expect((dialogue.getContent() as DialogueLine).text).toEqual('mod assignment');
    expect(dialogue.getVariable('a')).toBe(0);
  });

  it('only sets variable once when using init assignment', () => {
    const content = parse(`
{ set a ?= 1} this should be %a%
{ set a ?= 2} this should be %a% again
`
    );
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be 1');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be 1 again');
  });

  it('appends uninitialized variables correctly', () => {
    const content = parse(`
{ set a += 1} this should be %a%
{ set b -= 2} this should be %b%
{ set c *= 3} this should be %c%
{ set d /= 4} this should be %d%
{ set e %= 5} this should be %e%
{ set f ^= 5} this should be %f%
`
    );
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be 1');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be -2');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be 0');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be 0');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be 0');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this should be 0');
  });

  it('set variables externally', () => {
    const content = parse('vars %id% %name%\nvars %id% %name%\n');
    const dialogue = Interpreter(content);

    dialogue.setVariable('id', 'some_id');
    dialogue.setVariable('name', 'some name');

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'vars some_id some name' });

    dialogue.setVariable('id', 'some other id');

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'vars some other id some name' });
  });

  it('prints undefined variables as ""', () => {
    const content = parse('var %id% here');
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'var  here' });
  });

  it('set external variable via dialogue', () => {
    const content = parse('lets set a variable {set @something="the"}\nthis is %@something% variable\n');
    const dialogue = Interpreter(content);

    expect((dialogue.getContent() as DialogueLine).text).toEqual('lets set a variable');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('this is the variable');
  });

  it('set external variable externally', () => {
    const content = parse('vars %@id% %@name% %id%\nvars %@id% %@name% %id%\n');
    const dialogue = Interpreter(content);

    dialogue.setExternalVariable('id', 'some_id');
    dialogue.setExternalVariable('name', 'some name');
    dialogue.setVariable('id', 'internal_id');
    dialogue.setVariable('some_internal_var', 'internal_id');

    expect(dialogue.getExternalVariable('id')).toBe("some_id");
    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'vars some_id some name internal_id' });

    dialogue.setExternalVariable('id', 'some other id');

    expect(dialogue.getContent()).toEqual({ type: 'line', text: 'vars some other id some name internal_id' });
    expect(dialogue.getExternalVariable("some_internal_var")).toEqual(undefined);
  });
});


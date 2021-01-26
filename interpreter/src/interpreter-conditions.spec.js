import { parse } from 'clyde-parser';
import { Interpreter } from './interpreter';

describe("Interpreter: conditions", () => {
  it('show only lines that meet the criteria', () => {
    const content = parse(`
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

  it('use condition on options', () => {
    const content = parse(`
{set choice_count = 0 }
+ [always]
  forevaaa
  <-
{ choice_count < 1 } * [one time]
  a { set choice_count += 1 }
  <-
{ choice_count < 2 } + [twice]
  b { set choice_count += 1 }
  <-
`
    );
    const dialogue = Interpreter(content);

    expect(dialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'always' },{ label: 'one time' }, { label: 'twice' } ] });
    dialogue.choose(2);
    expect(dialogue.getContent().text).toEqual('b');

    expect(dialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'always' }, { label: 'twice' } ] });

    dialogue.choose(1);
    expect(dialogue.getContent().text).toEqual('b');

    expect(dialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'always' }] });
  });
});


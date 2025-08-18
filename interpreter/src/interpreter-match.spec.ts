import { parse } from '@clyde-lang/parser';
import { Interpreter, DialogueLine } from './interpreter';

describe("Interpreter: match conditions", () => {
  it('match the right condition', () => {
    const content = parse(`
{
  match fruit
    'banana':
      This is a banana
    'apple':
      This is an apple
    default:
      whatever

}
`
    );
    const dialogue = Interpreter(content);
    dialogue.setVariable('fruit', 'apple');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('This is an apple');
  });

  it('match default branch if no other branch matches', () => {
    const content = parse(`
{
  match fruit
    'banana':
      This is a banana
    'apple':
      This is an apple
    default:
      This is the default branch
}
`
    );
    const dialogue = Interpreter(content);
    dialogue.setVariable('fruit', 'pineapple');

    expect((dialogue.getContent() as DialogueLine).text).toEqual('This is the default branch');
  });

  it('does not show anything if no matches', () => {
    const content = parse(`
{
  match fruit
    'banana':
      This is a banana
    'apple':
      This is an apple
}
continue
`
    );
    const dialogue = Interpreter(content);
    dialogue.setVariable('fruit', 'pineapple');

    expect((dialogue.getContent() as DialogueLine).text).toEqual('continue');
  });

  it('works inline', () => {
    const content = parse(`
{
  match fruit
    'banana': This is a banana
    'apple': This is an apple
    default:
      whatever
}
`
    );
    const dialogue = Interpreter(content);
    dialogue.setVariable('fruit', 'apple');
    expect((dialogue.getContent() as DialogueLine).text).toEqual('This is an apple');
  });
});


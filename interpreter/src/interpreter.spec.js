import { parse } from 'clyde-parser';
import { Interpreter } from './interpreter';

describe("Interpreter", () => {
  describe('lines', () => {
    it('get lines', () => {
      const content = parse('Hello!\nHi there.\nHey.#tag\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hello!' });
      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hi there.' });
      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hey.', tags: ['tag']});
    });

    it('get lines with details', () => {
      const content = parse('speaker1: Hello! $123\nspeaker2: Hi there. $abc\n');
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hello!', speaker: 'speaker1', id: '123'});
      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hi there.', speaker: 'speaker2', id: 'abc' });
    });
  });

  describe('Events', () => {
    it('trigger event on variable changed', (done) => {
      const content = parse('Hi!{ set something = 123 }\n');
      const dialogue = Interpreter(content);

      dialogue.setVariable('something', 456);

      dialogue.on(dialogue.events.VARIABLE_CHANGED, (data) => {
        expect(data).toEqual({ name:'something', value: 123, previousValue: 456 });
        done();
      });

      dialogue.getContent()
    });

    it('remove listener', (done) => {
      const content = parse('Hi!{ set something = 123 }\n');
      const dialogue = Interpreter(content);

      const callback = dialogue.on(dialogue.events.VARIABLE_CHANGED, () => {
        throw new Error('should not have triggered listener');
      });

      dialogue.off(dialogue.events.VARIABLE_CHANGED, callback);

      dialogue.getContent()

      setTimeout(() => done(), 100);
    });

    it('trigger dialogue event', (done) => {
      const content = parse('Hi!{ trigger some_event }\n');
      const dialogue = Interpreter(content);

      dialogue.on(dialogue.events.EVENT_TRIGGERED, (data) => {
        expect(data).toEqual({ name:'some_event' });
        done();
      });

      dialogue.getContent()
    });

    it('trigger standalone dialog event', (done) => {
      const content = parse('{ trigger some_event }\n');
      const dialogue = Interpreter(content);

      dialogue.on(dialogue.events.EVENT_TRIGGERED, (data) => {
        expect(data).toEqual({ name:'some_event' });
        done();
      });

      dialogue.getContent()
    });
  });

  describe('persistence', () => {
    it('get all data and start new instance with right state', () =>{
      const content = parse(`
* [a]
  Hi!{ set someVar = 1 }
* [b]
  hello %someVar%
`);
      const dialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'a' }, { label: 'b' }] });
      dialogue.choose(0);
      expect(dialogue.getContent().text).toEqual('Hi!');

      const newDialogue = Interpreter(content, dialogue.getData());

      expect(newDialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'b' }] });
      newDialogue.choose(0);
      expect(newDialogue.getContent().text).toEqual('hello 1');
    });

    it('get all data and load in another instance', () =>{
      const content = parse(`
* [a]
  set as 1!{ set someVar = 1 }
* [b]
  set as 2!{ set someVar = 2 }
result is %someVar%
`);
      const dialogue = Interpreter(content);
      const anotherDialogue = Interpreter(content);

      expect(dialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'a' }, { label: 'b' }] });
      expect(anotherDialogue.getContent()).toEqual({ type: 'options', options: [{ label: 'a' }, { label: 'b' }] });
      dialogue.choose(0);
      anotherDialogue.choose(1);
      expect(dialogue.getContent().text).toEqual('set as 1!');
      expect(anotherDialogue.getContent().text).toEqual('set as 2!');

      anotherDialogue.loadData(dialogue.getData());

      expect(anotherDialogue.getContent().text).toEqual('result is 1');
    });

    it('clear all data', () =>{
      const content = parse(`
Hi!{ set someVar = 1 }
hello %someVar%
`);
      const dialogue = Interpreter(content);

      expect(dialogue.getContent().text).toEqual('Hi!');
      dialogue.clearData();
      expect(dialogue.getContent().text).toEqual('hello ');
    });
  });

  describe('End of dialogue', () => {
    it('get undefined when not more lines left', () => {
      const content = parse('Hi!\n');
      const dialogue = Interpreter(content);
      expect(dialogue.getContent()).toEqual({ type: 'line', text: 'Hi!' });
      expect(dialogue.getContent()).toBe(undefined);
      expect(dialogue.getContent()).toBe(undefined);
    });
  });

  describe('translation', () => {
    it('define dictionary and bring keys from it when available', () => {
      const dictionary = {
        abc: 'this is a replacement',
        ghi: 'replaced',
        jkl: 'replaced 2',
        mno: 'replaced 3',
      };

      const content = parse(`
This will not be replaced
This should be replaced $abc
This will not be replaced either $def
replace $ghi
  * [replace $jkl]
    <-
(
  -replace $mno
)
`);
      const dialogue = Interpreter(content, undefined, dictionary);
      expect(dialogue.getContent().text).toEqual('This will not be replaced');
      expect(dialogue.getContent().text).toEqual('this is a replacement');
      expect(dialogue.getContent().text).toEqual('This will not be replaced either');
      expect(dialogue.getContent()).toEqual({ id: 'ghi', type: 'options', name: 'replaced', options: [{ id: 'jkl', label: 'replaced 2' }]});
      dialogue.choose(0);
      expect(dialogue.getContent().text).toEqual('replaced 3');
    });

    it('load dictionaries on runtime', () => {
      const dictionaryFR  = { abc: 'Bonjour' };
      const dictionaryES  = { abc: 'Hola' };
      const dictionaryPT  = { abc: 'Olá' };

      const content = parse(`Hello $abc\n`);
      const dialogue = Interpreter(content, undefined);
      expect(dialogue.getContent().text).toEqual('Hello');
      dialogue.begin();
      dialogue.loadDictionary(dictionaryFR);
      expect(dialogue.getContent().text).toEqual('Bonjour');
      dialogue.begin();
      dialogue.loadDictionary(dictionaryES);
      expect(dialogue.getContent().text).toEqual('Hola');

      dialogue.begin();
      dialogue.loadDictionary(dictionaryPT);
      expect(dialogue.getContent().text).toEqual('Olá');
    });
  });

  describe('Unknowns', () => {
    it('fails when unkown node type detected', () => {
      const content = parse('Hi!\n');
      content.type = 'SomeUnkownNode';
      const dialogue = Interpreter(content);

      expect(() => dialogue.getContent()).toThrow(/Unkown node type "SomeUnkownNode"/);
    });
  });
});


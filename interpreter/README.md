# Clyde Interpreter

[![npm version](https://badge.fury.io/js/%40clyde-lang%2Finterpreter.svg)](https://www.npmjs.com/package/@clyde-lang/interpreter)


Interpreter library for [Clyde dialogue language](https://github.com/viniciusgerevini/clyde/blob/master/LANGUAGE.md).

```javascript
import { parse } from '@clyde-lang/parser';
import { Interpreter } from '@clyde-lang/interpreter';

const content = parse(`

Hagrid: Yer a wizard, Harry!
Harry: I'm a what?
    * Hagrid: A wizard, Harry!
    * Hagrid: Yer a wizard!

`);

const dialogue = Interpreter(content);

dialogue.getContent()

//respone: { type: 'line', text: 'Yer a wizard, Harry!', speaker: 'Hagrid }

dialogue.getContent()

// response:
// {
//     type: 'options',
//     name: "I'm a what?",
//     speaker: 'Harry',
//     options: [
//         { label: 'A wizard, Harry!' },
//         { label: 'Yer a wizard!' }
//     ]
// }


dialogue.choose(1)

dialogue.getContent()

// response: { type: 'line', text: 'Yer a wizard', speaker: 'Hagrid }
```

## Instalation

```shell
npm install @clyde-lang/interpreter

# or

yarn add @clyde-lang/interpreter
```

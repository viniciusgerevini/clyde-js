# clyde-interpreter


Interpreter library for [Clyde dialogue language](https://github.com/viniciusgerevini/clyde/blob/master/LANGUAGE.md).

```javascript
import { parse } from 'clyde-parser';
import { Interpreter } from 'clyde-interpreter';

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

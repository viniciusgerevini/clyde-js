# clyde-parser

[![npm version](https://badge.fury.io/js/%40clyde-lang%2Fparser.svg)](https://www.npmjs.com/package/@clyde-lang/parser)

Parser for [Clyde dialogue language](https://github.com/viniciusgerevini/clyde/blob/master/LANGUAGE.md).

```javascript
import { parse } from 'clyde-parser';

const result = parse(`

Hagrid: Yer a wizard, Harry!
Harry: I'm a what?

`);
```

```javascript
// result
{
    type: 'document',
    content: [{
      type: 'content',
      content: [
        { type: 'line', value: 'Yer a wizard, Harry!', speaker: 'Hagrid' },
        { type: 'line', value: "I'm a what?", speaker: 'Harry' },
        { type: 'line', value: 'this has $everything:', id: 'id_on_first_line', tags: [ 'and_tags' ] },
      ]
    }],
    blocks: []
}
```

## Instalation

```shell

npm install @clyde-lang/parser

# or

yarn add @clyde-lang/parser

```

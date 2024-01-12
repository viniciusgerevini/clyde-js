# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

Check [LANGUAGE.md](./LANGUAGE.md) for latest documentation.

## Unreleased

### Added

- Assignment initializer operator `?=`. It only assigns if variable was not set before.

### Changed

- Return End of Dialogue object instead of undefined. `{ type: 'end' }`.
- Variation `shuffle` will do real randomization with no guarantee all items will be visited.


## 2.1.0 (2022-07-02)

### Added

Id Suffixes: `dialogue line $id&some_var&some_var2`.

Suffixes can help with dialogue localization and alternatives. Example:

dictionary:
```
LINE_1;Hello, my friend!
LINE_1&F;Hello, sister!
LINE_1&M;Hello, brother!
```
Dialogue:
```
Hello, my friend! $LINE_1&player_pronoun
```
In this case, if the `player_pronoun` variable is set as M, `Hello, brother!` is returned.
When F, `Hello, sister!` is returned. And when not set, the default LINE_1 `Hello, my friend!` is returned.

## 2.0.0 (2021-11-21)

### Breaking Changes

- Options won´t print first line as before.
- Brackets (`[]`) used for display-only options are not supported anymore.
- To reproduce previous behaviour, options should contain the new display-option symbol (`=`)

Here is a sample on how to fix your dialogues for this new version:

Old way:
```
+ This will be displayed
* This will be displayed
> This will be displayed

+ [This won't be displayed]
  some text...
* [This won't be displayed]
  some text...
> [This won't be displayed]
  some text...
```
New way:
```
+= This will be displayed
*= This will be displayed
>= This will be displayed

+ This won't be displayed
  some text...
* This won't be displayed
  some text...
> This won't be displayed
  some text...
```

### Changed

- Changed options default behaviour. (check breaking changes)

## 1.0.0 (2021-10-21)

### Breaking changes

Simple quotes (`'`) can be used for escaping characters. Any sentence starting with it
will be escaped.

```
This is a normal non-escaped line $100.
"This line will be printed as is: ###"
'This line is supported now and it will be printed as is: ###' -- this is the new change
```

### Changed

- Simple quotes (`'`) can be used for escaping characters.
- Simple quotes (`'`) can be used in String variables in logic blocks.
    - i.e `{ set text = 'this is valid' }`


## 0.0.1 (2021-02-17)

Initial release. Check `./LANGUAGE.md` for full documentation.


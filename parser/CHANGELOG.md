# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## 2.0.1 (2021-11-21)

### Fixed

- Options with closing brackets `]` would cause an infinite loop

## 2.0.0 (2021-11-21)

### Breaking Changes

Supporting new language options behaviour.

- Option lines are not included as content anymore.
- Supports `=` to keep old behaviour of showing the main line.
- Brackets (`[]`) for display only options are not required or allowed.

## 1.0.0 (2021-10-21)

### Breaking Changes

Dialogues starting with single quotes escape especial characters.

For example:
```
'This is a #quoted text'
```
Would previously return:
```
TEXT: 'this is a
TAG:  quoted
TEXT: text'
```
Now it returns:
```
TEXT: This is a #quoted text
```

### Changed

- support single quotes for logic block string literals and escaping dialogues.
    - `{ set string_literal = 'valid string' }`
    - `'This is a valid escaped dialogue line # $ '`


### Thanks

Thanks to @verillious for suggesting this change and contributing with the implementation on Godot plugin.

## 0.1.2 (2021-06-04)

### Changed

- pre-line conditional blocks may use WHEN keyword. Before it was reserved for blocks after lines

### Fixed

- diverts should support conditional blocks before and after
- upgrade dev dependencies to fix vulnerabilities

### Thanks

Thanks to @lapspider45 for notifying the divert issue

## 0.1.1 (2021-02-18)

### Changed

- Update README.md with right commands

## 0.1.0 (2021-02-17)

Initial release

### Added

- Expose parse function to parse Clyde dialogue strings.

# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## Unreleased

### Added

- Support speaker blocks
```
Vinny:
    Multiple lines can be set with same speaker.
    You just need to indent them after the speaker line.
    Grouping lines also work this way
        by indenting the line further.
```

### Changed

- Tags now accept `.` and `-` also.
- Variables now can start with `_`.

## 2.3.2 (2024-06-20)

### Fixed

- Dist files started being ignored by npm.

### Thanks

- Thanks to Aaron (@clogwyn55) for reporting this issue.

## 2.3.0 (2024-02-14)

### Added

- Assignment initializer operator `?=`. It only assigns if variable was not set before.
- Define and access external variable by using `@` prefix.

### Changed

- Increment assigment now have default values. i.e. If you run `set a += 1` when `a` is not set, it will be set to 1. Before it would break because value was null.

## 2.2.0 (2022-08-25)

### Added

- Implemented support for id suffixes. `dialogue line $id&variable_1&variable_2`.

## 2.1.2 (2022-07-04)

### Fixed

- Fix inconsistencies with logic blocks in tab indented files.

## 2.1.1 (2022-07-04)

Same as 2.1.0.

## 2.1.0 (2022-06-26)

### Added

- Implemented `addIds` function, to assign ids to every text line. Ignores lines with existing id.

## 2.0.2 (2022-06-20)

### Fixed

- Standalone `{set a}` would pass parsing, but break on interpreting. Now, this resolves to `{ set a = true }`.

### Changed

- TypeScript rewrite to improve tooling. Better types.

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

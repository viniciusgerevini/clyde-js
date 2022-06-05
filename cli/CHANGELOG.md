# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## 2.0.1 (2021-11-21)

### Changed

- Updated @clyde-lang/parser to v2.0.1 and @clyde-lang/interpreter to v2.0.1.

## 2.0.0 (2021-11-21)

### Breaking changes

Options do not display first line by default. Square brackets are not allowed anymore.

### Changed

- Updated @clyde-lang/parser to v2.0.0 and @clyde-lang/interpreter to v2.0.0.
- Option lines are not included as content anymore.
- Supports `=` to keep old behaviour of showing the main line.
- Brackets (`[]`) for display only options are not required or allowed.

## 1.0.1 (2021-10-21)

### Breaking changes

Dialogues starting with single quotes escape especial characters.

### Changed

- Updated @clyde-lang/parser to 1.0.0. Supports single quotes for string literals and escaping dialogue lines.
  - `{ set string_literal = 'valid string' }`
  - `'This is a valid escaped dialogue line # $ '`
- Updated @clyde-lang/interpreter to 1.0.0


## 0.1.2 (2021-10-05)

### Fixed
- upgrade @clyde-lang/interpreter to align shuffle behaviour with docs.

## 0.1.1 (2021-06-04)

### Fixed

- upgrade @clyde-lang/parser to support logical diverts

## 0.1.0 (2021-02-18)

Initial release

### Added

- `clyde` command
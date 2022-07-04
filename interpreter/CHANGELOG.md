# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## 3.0.2 (2022-07-04)

### Fixed
- Update parser to fix inconsistencies with logic blocks in tab indented files.

## 3.0.1 (2022-07-04)

Same as 3.0.0.

## 3.0.0 (2022-06-20)

## Breaking Changes

event type constant are now exposed via `EventTypes` and not as `interpreter.events` anymore.

### Changed

- Update `@clyde-lang/parser` to `2.0.2`.
- TypeScript rewrite to improve tooling. Better types.

### Fixed

- Standalone `{set a}` would pass parser, but break on interpreter. Now, this resolves to `a = true`.

## 2.0.1 (2021-11-21)

### Fixed

- Updated @clyde-lang/parser to v2.0.1 to fix options with closing brackets `]` causing an infinite loop

## 2.0.0 (2021-11-21)

### Breaking Changes

Updated @clyde-lang/parser to v2.0.0 to support new Options behaviour.

- Option lines are not included as content anymore.
- Supports `=` to keep old behaviour of showing the main line.
- Brackets (`[]`) for display only options are not required or allowed.

## 1.0.0 (2021-10-21)

### Breaking changes

Dialogues starting with single quotes escape especial characters.

### Changed

- Updated @clyde-lang/parser to 1.0.0. Supports single quotes for string literals and escaping dialogue lines.

## 0.1.3 (2021-10-05)

### Breaking Changes

Cycle is default variation when using shuffle without explictly declaring mode.
```
( shuffle
    - variation 1
    - variation 2
)
-- is equivalent to
( shuffle cycle
    - variation 1
    - variation 2
)
```
It used to be `sequence`, which is wrong according to the documentation. As the documentation always stated this behaviour, I'll only bump a patch.


### Fixed

- fix: shuffle default variation should be "cycle"

## 0.1.2 (2021-06-04)

### Fixed

- updrade @clyde-lang/parser to support logical diverts
- upgrade dev dependencies to fix vulnerabilities

## 0.1.1 (2021-02-18)

### Changed

- Package description

## 0.1.0 (2021-02-18)

Initial release

### Added

- Expose Interpreter to read Clyde Dialogue Objects.

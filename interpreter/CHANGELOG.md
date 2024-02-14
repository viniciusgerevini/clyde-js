# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## 4.0.0 (2024-02-14)

### Breaking changes

- Dialogues now return an object when ended. This impacts how you determined if the dialogue has ended.
- Changed identifier for blocks when persisting so changing block order does not impact already saved files. This will impact variations and single use options on all existing save files.
- Standalone `shuffle` variation does not behave like `shuffle cycle` anymore. Now there is no guarantee all items will be returned. Real random.

### Added

- Assignment initializer operator `?=`. It only assigns if variable was not set before.
- External variable support. Implemented `set_external_variable` and `get_external_variable`.

### Changed

- Increment assigment now have default values. i.e. If you run `set a += 1` when `a` is not set, it will be set to 1. Before it would break because value was null.
- Return End of Dialogue object instead of undefined
- Make standalone `shuffle` work really randomly. Variation does not behave like `shuffle cycle` anymore. Now there is no guarantee all items will be returned.

### Fixed

- Changing block order in file does not impact persisted options and variations anymore.


## 3.1.0 (2022-08-25)

### Added

- Implemented support for id suffixes. `dialogue line $id&variable_1&variable_2`.

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

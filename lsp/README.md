# Clyde Language Server

> [!WARNING]
> This is a work in progress

This is a language server for Clyde Dialogue Language.

## Features

- Syntax highlighting (semantic tokens)
- Diagnostics (parsing errors)
- Autocomplete (Block names, Speakers, Linked files)
- Go to definition (go to block from divert)

## TO DO

- [x] basic server info (language version, etc)
- [x] syntax highlighting
- [x] auto complete
  - [x] divert > block
  - [x] Speakers
  - [x] linked files
  - [x] block from linked file
- [ ] go to definition
  - [x] block
  - [x] block from linked file
  - [x] file
    - [ ] deal with shorthands (file without extension, file without path (default folder))
- [x] diagnostics / parsing errors
- [x] rename
  - [x] speakers
  - [x] block
  - [x] tags
- [ ] distribution
  - [ ] npm package
  - [ ] standalone (SEA, bun or dino, whatever is easier)
- [ ] setup instructions
  - [ ] NVIM
  - [ ] VS Code? Others?
- [ ] enhancements (stretch, maybe won't do)
  - [ ] diagnostics, show warning for diverts with no existing blocks
- [ ] workspace
  - [ ] define clyde.config.json file
  - [ ] use clyde.config or default

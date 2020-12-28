# Clyde


## TODO

### Language
- [x] lines
- [x] comments (`#`)
- [x] blocks (== this_is_a_block)
- [x] option block (`>>`)
- [x] option block with description line (`>> some line here`)
- [x] options (`*`)
- [x] sticky option (`+`)
- [x] string with quotes for special characters
- [x] line id (`this is a line #id: hey`)
- [x] speaker (speaker: this is a line)
- [x] set variables (`{ set var=true }`)
- [x] conditional lines (`{ is_first_run && speaker_hp > 10 }`)
- [x] block divert (`-> block_name`)
- [x] parent divert (`<-`). Goes to parent block, option list, or divert
- [x] anchors, like in `(some_anchor)`, where we can divert like this `> some_anchor`
- [x] maybe change id syntax, as it may conflict with comments (`$id:`)
- [x] alternatives with mode: sequence, only one, execute once each, execute cycle, execute random (`!!sequence`)
- [ ] option title speaker and id
- [ ] option name id
- [ ] normalize objects .ie content in option is an object, but it's an array in other places
- [ ] line tags
- [ ] event trigger

### Improvements

- [x] error messages
- [x] make line and column position more accurate
- [x] implement snapshot tests with examples
- [x] instantiate parser / lexer before each test. Currently there is state inside the lexer


### Docs
- [ ] usage docs
- [ ] examples
- [ ] README


### Tooling

- [ ] Editor
- [ ] CLI
- [ ] interpreter: show lines
- [ ] interpreter: interactive
- [ ] interpreter: show diagram?
- [ ] online interpreter/editor
- [ ] Godot client / example
- [ ] C# client class
- [ ] Godot importer (depends on CLI)
- [ ] Syntax file (VIM? VSCode?)

### Extras Ideas
- LSP
- text adventure CLI

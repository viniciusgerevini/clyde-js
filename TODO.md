# TODO

next:
- generate ids for file (it will probably require reverse parsing first)
    - how to keep linebreaks in multiline phrases? maybe iterate over editor lines
- reverse parsing
    - option to break dialogue lines in multiline after n characters
- desktop editor

- [ ] language
    - [x] parent divert in block does not work
    - [x] new parser
    - [x] escape in normal text ( i.e. `\:`)
    - [x] double quotes with empty string showing undefined message
    - [x] check this scenarios
    - [ ] variations short symbols (~ ! )
- [ ] editor interface
    - [x] main structure
    - [x] split horizontal, vertical http://react-split-pane-v2.surge.sh/?SimpleExample
    - [ ] help screen
    - [x] sync interpreter and editor file
    - [ ] dark mode
- [ ] editor interpreter
    - [x] action bar: play, reset, clean
    - [x] show debug bottom pane
    - [x] options menu: 'verbose, persistent, etc'
    - [x] scroll
    - [x] mouse support
    - [ ] keyboard support
    - [x] dialog bubbles mode
    - [ ] watch mode
    - [x] interpreter only view
    - [ ] tabs? multi files open
    - [x] add file change notification in interpreter timeline
    - [ ] divert to uunkown block fails
    - [ ] select first block when not default lines defined
    - [ ] handle actionnode before condition node situation
- [ ] editor
    - [x] show invisibles
    - [ ] vim mode/ emacs mode
    - [x] create clyde syntax mode
    - [x] line wrap?
    - [x] theme, dark or light mode
    - [x] soft tabs
    - [x] hightligh current line
    - [ ] can we change the generated document incrementally???
    - [ ] open file
    - [ ] switch files
    - [ ] rename files
    - [x] run file
    - [ ] compile file
    - [ ] search
    - [ ] persist preferences
    - [ ] download result file
- [ ] translator
    - [ ] generate ids buttom
    - [ ] translation editor
    - [ ] shows used translation lines in translation editor
    - [ ] shows id with not lines defined in the editor
    - [ ] generate clyde file using dictionary
- [ ] configuration
    - [ ] editor configuration file
    - [ ] project configuration file
    - [ ] key binds
- [ ] CLI
    - [x] compile file
    - [x] run interpreter command line
- [ ] reverse parser
    - [ ] transform JSON into clyde
- [ ] extras
    - [ ] autosave
    - [ ] new version notification
- [ ]  desktop app
    - [ ] electron wrapper
    - [ ] start gui interpreter only `clyde -i file.clyde`
    - [ ] start gui editor: (load file in the editor)

### Docs
- [ ] usage docs
- [ ] examples
- [ ] README
- [ ] jsdoc
- [ ] d.ts file https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html


### Tooling

- [ ] Editor
- [ ] CLI
- [x] interpreter: show lines
- [x] interpreter: interactive
- [ ] online interpreter/editor
- [ ] Godot client / example
- [ ] C# client class
- [x] Godot importer
- [ ] Syntax file (VIM? VSCode?)

### Clean up
- run tests on CI
- build script
- generate electron app on ci

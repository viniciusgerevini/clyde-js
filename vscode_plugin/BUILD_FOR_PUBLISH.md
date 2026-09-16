# Build for publish instructions

For future me, because I will sure forget this.

I had some trouble with the node modules and the package can't be part of the workspace.

Also, I need the bundle file from the language_server, so the user doesn't need to install it themselves.

## Steps

- build language server from root
  - `yarn workspace @clyde-lang/language_server install`
  - `yarn workspace @clyde-lang/language_server build:bundle`
- build extension
  - `yarn build`
- copy bundled server
  - `yarn copy-server`
- generate package
  - `vsce package --yarn` (this will generate a vsix file that can be tested locally)
- publish
  - `vsce publish --yarn`

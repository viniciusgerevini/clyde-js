const {execute, buildArgsParser} = require('clyde-interpreter-cli');


async function executeInterpreter(argv, exitCallback) {
  try {
    await execute(argv, exitCallback);
  } catch (e) {
    console.log(e.message);
    exitCallback(1);
  }
}

module.exports = { buildInterpreterArgsParser: buildArgsParser, executeInterpreter };


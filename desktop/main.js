const { app, BrowserWindow } = require('electron')
const yargs = require('yargs/yargs');

const { buildCompilerArgsParser, executeCompiler } = require('./src/compiler');
const { buildInterpreterArgsParser, executeInterpreter } = require('./src/interpreter');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (app.isPackaged) {
    win.loadFile('build/index.html')
  } else {
    win.loadURL('http://localhost:3000');
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('ready', async () => {
  let argv = process.argv;
  if (process.argv[0].includes('electron')) {
    argv = process.argv.slice(2);
  }

   yargs(argv)
    .usage('Usage: $0 [options] [file path]')
    .command('$0', 'Executes clyde editor', () => {}, executeGUI)
    .command(
      'run',
      'Command line interpreter',
      (yargs) => buildInterpreterArgsParser(yargs, '$0 run'),
      (_argv) => executeInterpreter(process.argv.slice(3), app.quit)
    )
    .command(
      'compile',
      'Transform *.clyde file to *.json',
      (yargs) => buildCompilerArgsParser(yargs),
      (argv) => executeCompiler(argv, app.quit)
    )
    .help()
    .argv;
});

function executeGUI() {
  createWindow();
}

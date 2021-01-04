const { app, BrowserWindow } = require('electron')
const yargs = require('yargs/yargs');

// FIXME hacky solution until electron implements esm support
const interpreter = (async () => {
    const {execute, buildArgsParser} = await import('clyde-interpreter-cli');
    return { execute, buildArgsParser };
})();

let isInCliMode = false;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (isInCliMode) {
    return;
  }

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('ready', async () => {
  let argv = process.argv;
  if (process.argv[0].includes('electron')) {
    argv = process.argv.slice(2);
  }
  const { buildArgsParser } = await interpreter;

   yargs(argv)
    .usage('Usage: $0 [options] [file path]')
    .command('$0', 'Executes clyde editor', () => {}, executeGUI)
    .command('run', 'Command line interpreter', (yargs) => buildArgsParser(yargs, '$0 run'), executeInterpreter)
    .help()
    .argv;
});

function executeGUI() {
  isInCliMode = false;
  console.log('this command will be run by default')
  createWindow();
}

async function executeInterpreter() {
  const { execute } = await interpreter;
  isInCliMode = true;
  try {
    await execute(process.argv.slice(3), () => app.quit());
  } catch (e) {
    console.log(e.message);
    app.quit();
  }
}

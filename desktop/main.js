const { app, BrowserWindow } = require('electron')
const yargs = require('yargs/yargs');

const {execute, buildArgsParser} = require('clyde-interpreter-cli');

let isInCliMode = false;

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
  isInCliMode = true;
  try {
    await execute(process.argv.slice(3), () => app.quit());
  } catch (e) {
    console.log(e.message);
    app.quit();
  }
}

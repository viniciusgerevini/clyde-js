import fs from 'node:fs';

interface ILogger {
  info(message: string, extras?: object): void;
  warn(message: string, extras?: object): void;
  error(error: string | Error, extras?: object): void;
  debug(message: string, extras?: object): void;
}

const LOG_FILE = "/var/tmp/clydelsp.log"

class FileLogger implements ILogger {
  info(message: string, extras?: object): void {
    this._writeLogLine(message, extras);
  }

  warn(message: string, extras?: object): void {
    this._writeLogLine(`WARN: ${message}`, extras);
  }

  error(error: string | Error, extras?: object): void {
    let message = ""
    if (typeof error === 'string') {
      message = error;
    } else {
      message = `${error.name}: ${error.message}`;
    }

    this._writeLogLine(`ERROR: ${message}`, extras);
  }

  debug(message: string, extras?: object): void {
    this._writeLogLine(`DEBUG: ${message}`, extras);
  }

  private _writeLogLine(message: string, extras: object | undefined): void {
    const content = `${message}${extras ? ` | ${JSON.stringify(extras)}` :''}\n`;
    try {
      fs.appendFileSync(LOG_FILE, content);
    } catch(_e) {
      // nothing I can do unfortunately
    }
  }
}

export function getLogger():  ILogger {
  // TODO add debugger option to return a noop if not in debug node
  return new FileLogger();
}

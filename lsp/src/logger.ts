import fs from "node:fs";

enum LogLevel {
  DISABLED = 0,
  ERROR_ONLY = 1,
  NORMAL = 2,
  DEBUG = 3,
}

interface ILogger {
  info(message: string, extras?: object): void;
  warn(message: string, extras?: object): void;
  error(error: string | Error, extras?: object): void;
  debug(message: string, extras?: object): void;
}

const LOG_FILE = "/var/tmp/clydelsp.log";

class FileLogger implements ILogger {
  constructor(private level: LogLevel) {}

  info(message: string, extras?: object): void {
    if (this._isLogEnabled(LogLevel.NORMAL)) {
      this._writeLogLine(message, extras);
    }
  }

  warn(message: string, extras?: object): void {
    if (this._isLogEnabled(LogLevel.NORMAL)) {
      this._writeLogLine(`WARN: ${message}`, extras);
    }
  }

  error(error: string | Error, extras?: object): void {
    let message = "";
    if (typeof error === "string") {
      message = error;
    } else {
      message = `${error.name}: ${error.message}`;
    }

    this._writeLogLine(`ERROR: ${message}`, extras);
  }

  debug(message: string, extras?: object): void {
    if (this._isLogEnabled(LogLevel.DEBUG)) {
      this._writeLogLine(`DEBUG: ${message}`, extras);
    }
  }

  private _isLogEnabled(level: LogLevel): boolean {
    return this.level >= level;
  }

  private _writeLogLine(message: string, extras: object | undefined): void {
    const content = `${message}${extras ? ` | ${JSON.stringify(extras)}` : ""}\n`;
    try {
      fs.appendFileSync(LOG_FILE, content);
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // nothing I can do unfortunately
    }
  }
}

class NoopLogger implements ILogger {
  info(_message: string, _extras?: object): void {}
  warn(_message: string, _extras?: object): void {}
  error(_error: string | Error, _extras?: object): void {}
  debug(_message: string, _extras?: object): void {}
}

export function getLogger(): ILogger {
  if (getCurrentLevel() === LogLevel.DISABLED) {
    return new NoopLogger();
  }
  return new FileLogger(getCurrentLevel());
}

function getCurrentLevel(): LogLevel {
  return Number(process.env["LOG_LEVEL"]) || 0;
}

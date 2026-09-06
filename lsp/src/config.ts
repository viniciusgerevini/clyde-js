import { URL } from "node:url";
import { LogLevel } from "./utils/logger.js";
import fs from "node:fs";
import type { WorkspaceFolder } from "vscode-languageserver";

export const SERVER_VERSION = "0.0.1";

const CONFIG_FILE_NAME: string = "clyde.config.json";

let logFile: string = "/tmp/clydels.log";
let logLevel: number = 0;
let parseDelayInMs: number = 300;

let defaultDialogueFolder: string = "";

export function loadConfigFromArguments(argv: string[]) {
  logLevel = 0;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--log-level") {
      loadLogLevel(argv[i + 1]);
      i++;
      continue;
    }
    if (arg === "--parse-debounce-time") {
      loadParseDelay(argv[i + 1]);
      i++;
      continue;
    }
    if (arg === "--log-file") {
      loadLogFile(argv[i + 1]);
      i++;
      continue;
    }
  }
}

function loadLogLevel(arg: any) {
  logLevel = isNaN(arg) ? 0 : Number(arg);
}

function loadParseDelay(arg: any) {
  parseDelayInMs = isNaN(arg) ? 300 : Number(arg);
}

function loadLogFile(arg: any) {
  logFile = arg;
}

export function getLogLevel(): LogLevel {
  return logLevel;
}

export function getLogFilePath(): string {
  return logFile;
}

export function getParseDelayInMs(): number {
  return parseDelayInMs;
}

export function getFileUriInDefaultDialogueFolder(filePath: string): string {
  try {
    return new URL(filePath, defaultDialogueFolder).href;
  } catch {
    return "";
  }
}

export function findAndLoadConfig(folders: WorkspaceFolder[]) {
  let workspaceRoot: string = "";

  for (let folder of folders) {
    try {
      workspaceRoot = folder.uri;
      if (!workspaceRoot.endsWith("/")) {
        workspaceRoot += "/";
      }
      const configFilePath = new URL(CONFIG_FILE_NAME, workspaceRoot);

      if (!fs.existsSync(configFilePath)) {
        continue;
      }

      const text = fs.readFileSync(configFilePath, "utf8");
      const config = JSON.parse(text);

      if (config.defaultFolder) {
        defaultDialogueFolder = new URL(
          !config.defaultFolder.endsWith("/") ? config.defaultFolder + "/" : config.defaultFolder,
          folder.uri,
        ).href;
        break;
      }
    } catch {}
  }

  if (!defaultDialogueFolder) {
    defaultDialogueFolder = new URL("dialogues/", workspaceRoot).href;
  }
}

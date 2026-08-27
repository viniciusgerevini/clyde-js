import { URL } from "node:url";
import { LogLevel } from "./utils/logger.js";
import fs from "node:fs";
import type { WorkspaceFolder } from "vscode-languageserver";

export const SERVER_VERSION = "0.0.1";

const CONFIG_FILE_NAME = "clyde.config.json";
export const LOG_FILE = "/tmp/clydels.log";

let defaultDialogueFolder: string = "";

export function getLogLevel(): LogLevel {
  return isNaN(process.env["LOG_LEVEL"] as any) ? 0 : Number(process.env["LOG_LEVEL"]);
}

export function getParseDelayInMs(): number {
  return isNaN(process.env["PARSE_DELAY"] as any) ? 500 : Number(process.env["PARSE_DELAY"]);
}

export function getFileUriInDefaultDialogueFolder(filePath: string): string {
  try {
    return new URL(filePath, defaultDialogueFolder).href;
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
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
      // eslint-disable-next-line no-unused-vars
    } catch (e) {}
  }

  if (!defaultDialogueFolder) {
    defaultDialogueFolder = new URL("dialogues/", workspaceRoot).href;
  }
}

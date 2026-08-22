import { LogLevel } from "./utils/logger.js";

export const SERVER_VERSION = "0.0.1";

export const LOG_FILE = "/var/tmp/clydelsp.log";

export function getLogLevel(): LogLevel {
  return isNaN(process.env["LOG_LEVEL"] as any) ? 0 : Number(process.env["LOG_LEVEL"]);
}

export function getParseDelayInMs(): number {
  return isNaN(process.env["PARSE_DELAY"] as any) ? 500 : Number(process.env["PARSE_DELAY"]);
}

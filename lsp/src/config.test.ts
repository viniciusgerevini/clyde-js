import { describe, it, beforeEach, expect, afterEach, Mock, vi } from "vitest";
import fs from "node:fs";
import {
  findAndLoadConfig,
  getFileUriInDefaultDialogueFolder,
  getLogLevel,
  getParseDelayInMs,
} from "./config";

describe("Config", () => {
  describe("getLogLevel", () => {
    let originalLogLevel: string | undefined;

    beforeEach(() => {
      originalLogLevel = process.env["LOG_LEVEL"];
    });

    afterEach(() => {
      process.env["LOG_LEVEL"] = originalLogLevel;
    });

    it("returns log level from LOG_LEVEL env variable", () => {
      process.env["LOG_LEVEL"] = "3";
      expect(getLogLevel()).toBe(3);
    });

    it("defaults to DISABLED when environment variable is not set", () => {
      delete process.env["LOG_LEVEL"];
      expect(getLogLevel()).toBe(0);
    });

    it("fallback to DISABLED when LOG_LEVEL has invalid value", () => {
      process.env["LOG_LEVEL"] = "banana";
      expect(getLogLevel()).toBe(0);
    });
  });

  describe("getParseDelayInMs", () => {
    let originalParseDelay: string | undefined;

    beforeEach(() => {
      originalParseDelay = process.env["PARSE_DELAY"];
    });

    afterEach(() => {
      process.env["PARSE_DELAY"] = originalParseDelay;
    });

    it("returns delay info from PARSE_DELAY env variable", () => {
      process.env["PARSE_DELAY"] = "335";
      expect(getParseDelayInMs()).toBe(335);
    });

    it("defaults to 500ms when environment variable is not set", () => {
      delete process.env["PARSE_DELAY"];
      expect(getParseDelayInMs()).toBe(500);
    });

    it("fallback to 500 when environment has invalid value", () => {
      process.env["PARSE_DELAY"] = "banana";
      expect(getParseDelayInMs()).toBe(500);
    });
  });

  describe("default dialogue folder", () => {
    let existsSyncStub: Mock;
    let readFileSyncStub: Mock;

    beforeEach(() => {
      existsSyncStub = vi.spyOn(fs, "existsSync");
      readFileSyncStub = vi.spyOn(fs, "readFileSync");

      existsSyncStub.mockReturnValue(false);
      readFileSyncStub.mockReturnValue("");
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("returns empty string when default folder is not defined", () => {
      const result = getFileUriInDefaultDialogueFolder("file:///a.clyde");
      expect(result).toEqual("");
    });

    it("defaults to /dialogues folder when no configuration file found", () => {
      findAndLoadConfig([{ uri: "file:///project" }]);
      const result = getFileUriInDefaultDialogueFolder("a.clyde");
      expect(result).toEqual("file:///project/dialogues/a.clyde");
      expect(existsSyncStub).toHaveBeenCalled();
      expect((existsSyncStub.mock.lastCall![0] as URL).href).toEqual(
        "file:///project/clyde.config.json",
      );
    });

    it("does not duplicate / when root workspace already has it in the uri", () => {
      findAndLoadConfig([{ uri: "file:///project/" }]);
      const result = getFileUriInDefaultDialogueFolder("a.clyde");
      expect(result).toEqual("file:///project/dialogues/a.clyde");
    });

    it("defaults to dialogues when clyde config file is found but can't be parsed", () => {
      existsSyncStub.mockReturnValue(true);
      readFileSyncStub.mockReturnValue("=!=");
      findAndLoadConfig([{ uri: "file:///project/" }]);
      const result = getFileUriInDefaultDialogueFolder("a.clyde");
      expect(result).toEqual("file:///project/dialogues/a.clyde");
    });

    it("defaults to dialogues when clyde config file is found but does not have defaultFolder config", () => {
      existsSyncStub.mockReturnValue(true);
      readFileSyncStub.mockReturnValue("{}");
      findAndLoadConfig([{ uri: "file:///project/" }]);
      const result = getFileUriInDefaultDialogueFolder("a.clyde");
      expect(result).toEqual("file:///project/dialogues/a.clyde");
    });

    it("uses defaultFolder config from clyde config file when present", () => {
      const customDialogueFolder = "./custom-dialogues/";
      existsSyncStub.mockReturnValue(true);
      readFileSyncStub.mockReturnValue(`{"defaultFolder": "${customDialogueFolder}" }`);
      findAndLoadConfig([{ uri: "file:///project/" }]);
      const result = getFileUriInDefaultDialogueFolder("a.clyde");
      expect(result).toEqual("file:///project/custom-dialogues/a.clyde");
    });

    it("appends / to defaultFolder config if not present", () => {
      const customDialogueFolder = "./custom-dialogues";
      existsSyncStub.mockReturnValue(true);
      readFileSyncStub.mockReturnValue(`{"defaultFolder": "${customDialogueFolder}" }`);
      findAndLoadConfig([{ uri: "file:///project/" }]);
      const result = getFileUriInDefaultDialogueFolder("a.clyde");
      expect(result).toEqual("file:///project/custom-dialogues/a.clyde");
    });
  });
});

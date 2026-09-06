import { describe, it, beforeEach, expect, afterEach, Mock, vi } from "vitest";
import fs from "node:fs";
import {
  findAndLoadConfig,
  getFileUriInDefaultDialogueFolder,
  getLogFilePath,
  getLogLevel,
  getParseDelayInMs,
  loadConfigFromArguments,
} from "./config";

describe("Config", () => {
  describe("loadConfigFromArguments", () => {
    const baseArgs = ["node", "script.js"];

    describe("Log level", () => {
      it("defaults to 0 when not set", () => {
        loadConfigFromArguments(baseArgs);

        expect(getLogLevel()).toEqual(0);
      });

      it("loads log level value from right argument", () => {
        const args = baseArgs.concat(["--log-level", "2"]);
        loadConfigFromArguments(args);

        expect(getLogLevel()).toEqual(2);
      });

      it("fallback to 0 when --log-level has invalid value", () => {
        const args = baseArgs.concat(["--log-level", "BANANA"]);

        loadConfigFromArguments(args);

        expect(getLogLevel()).toBe(0);
      });
    });

    describe("Log file path", () => {
      it("Use default when not set", () => {
        loadConfigFromArguments(baseArgs);

        expect(getLogFilePath()).toEqual("/tmp/clydels.log");
      });

      it("loads log file path value from right argument", () => {
        const args = baseArgs.concat(["--log-file", "/tmp/anotherfile"]);
        loadConfigFromArguments(args);

        expect(getLogFilePath()).toEqual("/tmp/anotherfile");
      });
    });

    describe("Parse delay", () => {
      it("defaults to 300ms when not set", () => {
        loadConfigFromArguments(baseArgs);
        expect(getParseDelayInMs()).toBe(300);
      });

      it("returns delay info from --parse-debounce-time", () => {
        const args = baseArgs.concat(["--parse-debounce-time", "335"]);

        loadConfigFromArguments(args);

        expect(getParseDelayInMs()).toBe(335);
      });

      it("fallback to default value when environment has invalid value", () => {
        const args = baseArgs.concat(["--parse-debounce-time", "BANANA"]);

        loadConfigFromArguments(args);

        expect(getParseDelayInMs()).toBe(300);
      });
    });

    it("loads multiple configs", () => {
      const args = baseArgs.concat(["--log-file", "/tmp/log", "--parse-debounce-time", "335"]);

      loadConfigFromArguments(args);

      expect(getLogFilePath()).toBe("/tmp/log");
      expect(getParseDelayInMs()).toBe(335);
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

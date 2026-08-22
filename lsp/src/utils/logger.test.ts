import { describe, it, vi, beforeEach, Mock, expect, afterEach } from "vitest";
import fs from "node:fs";
import { LOG_FILE } from "../config";
import { FileLogger, getLogger, LogLevel, NoopLogger } from "./logger";

describe("Logger", () => {
  let appendFileSyncStub: Mock;

  beforeEach(() => {
    appendFileSyncStub = vi.spyOn(fs, "appendFileSync");
    // set return type so original method is not called
    appendFileSyncStub.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getLogger", () => {
    it("returns noop when log level is DISABLED", () => {
      const logger = getLogger(LogLevel.DISABLED);
      expect(logger).toBeInstanceOf(NoopLogger);
    });

    it("returns filelogger when log level is othen than DISABLED", () => {
      const logger = getLogger(LogLevel.NORMAL);
      expect(logger).toBeInstanceOf(FileLogger);
    });

    it("returns logger based on LOG_LEVEL env variable when no level provided", () => {
      const currentLogLevel = process.env["LOG_LEVEL"];
      process.env["LOG_LEVEL"] = "3";

      const logger = getLogger();

      // reset back
      process.env["LOG_LEVEL"] = currentLogLevel;

      expect(logger).toBeInstanceOf(FileLogger);
      expect((logger as FileLogger).level).toBe(3);
    });

    it("defaults to noop", () => {
      const currentLogLevel = process.env["LOG_LEVEL"];
      delete process.env["LOG_LEVEL"];

      const logger = getLogger();

      // reset back
      process.env["LOG_LEVEL"] = currentLogLevel;

      expect(logger).toBeInstanceOf(NoopLogger);
    });
  });
  describe("FileLogger", () => {
    describe("error", () => {
      it("logs error to file", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        const errorName = "FakeError";
        const errorMessage = "This is a test error";
        const error = new Error(errorMessage);
        error.name = errorName;

        logger.error(error);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          LOG_FILE,
          `ERROR: ${errorName}: ${errorMessage}\n`,
        );
      });

      it("logs error string to file", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        const errorMessage = "This is a test error";
        logger.error(errorMessage);

        expect(appendFileSyncStub).toHaveBeenCalledWith(LOG_FILE, `ERROR: ${errorMessage}\n`);
      });

      it("logs error with extras", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        const errorMessage = "This is a test error";
        const extras = { details: "yep" };

        logger.error(errorMessage, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          LOG_FILE,
          `ERROR: ${errorMessage} | ${JSON.stringify(extras)}\n`,
        );
      });
    });

    describe("info", () => {
      it("logs info to file", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        const message = "This is a test";

        logger.info(message);

        expect(appendFileSyncStub).toHaveBeenCalledWith(LOG_FILE, `${message}\n`);
      });

      it("logs info with extras", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        const message = "This is a test";
        const extras = { details: "yep" };

        logger.info(message, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          LOG_FILE,
          `${message} | ${JSON.stringify(extras)}\n`,
        );
      });

      it("does not log info to file when log level is ERROR_ONLY", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        logger.info("Not supposed to be printed");
        expect(appendFileSyncStub).not.toHaveBeenCalled();
      });
    });

    describe("warn", () => {
      it("logs warn to file", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        const message = "This is a test";

        logger.warn(message);

        expect(appendFileSyncStub).toHaveBeenCalledWith(LOG_FILE, `WARN: ${message}\n`);
      });

      it("logs warn with extras", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        const message = "This is a test";
        const extras = { details: "yep" };

        logger.warn(message, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          LOG_FILE,
          `WARN: ${message} | ${JSON.stringify(extras)}\n`,
        );
      });

      it("does not log warn to file when log level is ERROR_ONLY", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        logger.warn("Not supposed to be printed");
        expect(appendFileSyncStub).not.toHaveBeenCalled();
      });
    });

    describe("debug", () => {
      it("logs debug to file", () => {
        const logger = new FileLogger(LogLevel.DEBUG);
        const message = "This is a test";

        logger.debug(message);

        expect(appendFileSyncStub).toHaveBeenCalledWith(LOG_FILE, `DEBUG: ${message}\n`);
      });

      it("logs debug with extras", () => {
        const logger = new FileLogger(LogLevel.DEBUG);
        const message = "This is a test";
        const extras = { details: "yep" };

        logger.debug(message, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          LOG_FILE,
          `DEBUG: ${message} | ${JSON.stringify(extras)}\n`,
        );
      });

      it("does not log debug to file when log level is NORMAL", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        logger.debug("Not supposed to be printed");
        expect(appendFileSyncStub).not.toHaveBeenCalled();
      });

      it("does not log debug to file when log level is ERROR_ONLY", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        logger.debug("Not supposed to be printed");
        expect(appendFileSyncStub).not.toHaveBeenCalled();
      });
    });
  });

  describe("NoopLogger", () => {
    it("does nothing in all methods", () => {
      const logger = new NoopLogger();

      logger.info("don't print");
      logger.debug("don't print");
      logger.warn("don't print");
      logger.error("don't print");

      expect(appendFileSyncStub).not.toHaveBeenCalled();
    });
  });
});

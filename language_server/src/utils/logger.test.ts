import { describe, it, vi, beforeEach, Mock, expect, afterEach } from "vitest";
import fs from "node:fs";
import { getLogFilePath, getLogLevel } from "../config";
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

    it("returns logger based on config log level when no level provided", () => {
      const logger = getLogger();

      expect(getLogLevel()).toBe(LogLevel.DISABLED);
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
          getLogFilePath(),
          `ERROR: ${errorName}: ${errorMessage}\n`,
        );
      });

      it("logs error string to file", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        const errorMessage = "This is a test error";
        logger.error(errorMessage);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          getLogFilePath(),
          `ERROR: ${errorMessage}\n`,
        );
      });

      it("logs error with extras", () => {
        const logger = new FileLogger(LogLevel.ERROR_ONLY);
        const errorMessage = "This is a test error";
        const extras = { details: "yep" };

        logger.error(errorMessage, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          getLogFilePath(),
          `ERROR: ${errorMessage} | ${JSON.stringify(extras)}\n`,
        );
      });
    });

    describe("info", () => {
      it("logs info to file", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        const message = "This is a test";

        logger.info(message);

        expect(appendFileSyncStub).toHaveBeenCalledWith(getLogFilePath(), `${message}\n`);
      });

      it("logs info with extras", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        const message = "This is a test";
        const extras = { details: "yep" };

        logger.info(message, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          getLogFilePath(),
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

        expect(appendFileSyncStub).toHaveBeenCalledWith(getLogFilePath(), `WARN: ${message}\n`);
      });

      it("logs warn with extras", () => {
        const logger = new FileLogger(LogLevel.NORMAL);
        const message = "This is a test";
        const extras = { details: "yep" };

        logger.warn(message, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          getLogFilePath(),
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

        expect(appendFileSyncStub).toHaveBeenCalledWith(getLogFilePath(), `DEBUG: ${message}\n`);
      });

      it("logs debug with extras", () => {
        const logger = new FileLogger(LogLevel.DEBUG);
        const message = "This is a test";
        const extras = { details: "yep" };

        logger.debug(message, extras);

        expect(appendFileSyncStub).toHaveBeenCalledWith(
          getLogFilePath(),
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

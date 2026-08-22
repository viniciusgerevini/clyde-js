import { describe, it, beforeEach, expect, afterEach } from "vitest";
import { getLogLevel, getParseDelayInMs } from "./config";

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
});

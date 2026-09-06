import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      LOG_LEVEL: 0, // disable all logs from logger
    },
    coverage: {
      reporter: ["text", "html", "clover", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});

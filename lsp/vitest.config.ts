import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      LOG_LEVEL: 0, // disable all logs from logger
    },
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});

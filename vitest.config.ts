import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts", "packages/**/*.test.ts", "apps/**/*.test.ts", "tests/**/*.test.ts"]
  }
});

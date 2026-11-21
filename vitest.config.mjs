import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,mjs,ts}"],
    setupFiles: ["tests/setup.js"],
    clearMocks: true,
    coverage: { provider: "v8", include: ["lib/server/**", "app/api/**", "proxy.ts"] },
  },
});

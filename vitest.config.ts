import { defineConfig } from "vitest/config";
import path from "path";

// Role 03's lib/sim/**/*.test.ts suite runs against plain TypeScript — no DOM, no React plugin,
// per the "pure, framework-independent" requirement in workflow/03-simulation-engine.md.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "lib/**/__tests__/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});

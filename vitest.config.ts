import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/.next/**"],
    server: {
      deps: {
        inline: [/@kannan19302/],
      },
    },

    // Process CSS rather than discarding it, so a component that reads
    // `styles.button` gets a class name instead of undefined.
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      all: true,
      // J02 — thresholds calibrated to the measured all-files floor so this
      // gate passes today and fails on regression; the ratchet may only rise.
      thresholds: {
        lines: 3,
        functions: 0,
        branches: 2,
        statements: 3,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

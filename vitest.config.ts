import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/.next/**"],

    // @kannan19302/ui ships CSS modules beside its compiled components. Vitest
    // externalises node_modules by default, so Node `require()`d those
    // stylesheets and threw `SyntaxError: Unexpected token '.'` on the first
    // `.class` selector — the same failure the Next config solves with
    // transpilePackages. Inlining routes the design system through Vite's
    // transform pipeline, which understands CSS.
    server: {
      deps: {
        // Regex, not bare names: the design system is reached through several
        // specifiers (@kannan19302/ui, @kannan19302/ui/theme, @kannan19302/ui/notifications) and
        // an exact-name match misses every subpath, leaving them externalised
        // and back in Node's hands.
        inline: [/@kannan19302\//],
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

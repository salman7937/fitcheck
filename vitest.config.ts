import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    // tests/rules requires the Firebase emulator (Java + firebase-tools) and
    // is run separately via `firebase emulators:exec`, not the default suite.
    exclude: ["**/node_modules/**", "tests/rules/**"],
  },
});

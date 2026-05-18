// Minimal ESLint config for react-hooks rules only — remove once Biome supports them.
// Discussion: https://github.com/biomejs/biome/discussions/5290
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  {
    ...reactHooks.configs.flat.recommended,
    files: ["src/**/*.ts*"],
    languageOptions: { parser: tsParser },
  },
  {
    files: ["src/**/*.ts*"],
    rules: { "react-hooks/exhaustive-deps": "off" },
  },
  {
    ignores: [
      "node_modules/**",
      "src/components/ui/**",
      "src/routeTree.gen.ts",
    ],
  },
]);

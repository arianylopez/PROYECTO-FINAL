import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import boundariesPlugin from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    plugins: {
      boundaries: boundariesPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-this-alias": "off",
      "import/order": "off",
      "boundaries/dependencies": [2, {
        "default": "disallow",
        "rules": [
          { "from": { "type": "app" }, "allow": ["pages", "widgets", "features", "entities", "shared"] },
          { "from": { "type": "pages" }, "allow": ["pages", "widgets", "features", "entities", "shared"] },
          { "from": { "type": "widgets" }, "allow": ["features", "entities", "shared"] },
          { "from": { "type": "features" }, "allow": ["entities", "shared"] },
          { "from": { "type": "entities" }, "allow": ["shared"] },
          { "from": { "type": "shared" }, "allow": ["shared"] }
        ]
      }]
    },
    settings: {
      "boundaries/elements": [
        { "type": "app", "pattern": "src/app/*" },
        { "type": "pages", "pattern": "src/pages/*" },
        { "type": "widgets", "pattern": "src/widgets/*" },
        { "type": "features", "pattern": "src/features/*" },
        { "type": "entities", "pattern": "src/entities/*" },
        { "type": "shared", "pattern": "src/shared/*" }
      ],
      "boundaries/ignore": ["**/*.test.*"]
    }
  },
  prettierConfig
);

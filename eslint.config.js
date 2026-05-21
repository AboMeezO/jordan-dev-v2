import js from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    ignores: ["eslint.config.js"],
  },

  {
    files: ["**/*.ts"],

    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },

    rules: {
      // =========================
      // IMPORT SAFETY
      // =========================
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",

      "unused-imports/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // =========================
      // TYPESCRIPT SAFETY
      // =========================
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",

      // =========================
      // DISCORD BOT SAFETY RULES
      // =========================

      // يمنع crash صامت من async handlers
      "@typescript-eslint/no-unsafe-argument": "error",

      // يمنع تجاهل نتائج async (مهم جدًا في interactions)
      "@typescript-eslint/no-unsafe-call": "warn",

      // يمنع console spam إلا عند الحاجة
      "no-console": "off",
    },
  },

  // =========================
  // OVERRIDES (Discord patterns)
  // =========================
  {
    files: ["src/Events/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },

  {
    files: ["src/Commands/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);

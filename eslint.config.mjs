import path from "node:path"
import { fileURLToPath } from "node:url"

import globals from "globals"
import importPlugin, { createNodeResolver } from "eslint-plugin-import-x"
import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import promise from "eslint-plugin-promise"
import react from "eslint-plugin-react"
import reactCompiler from "eslint-plugin-react-compiler"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import unicorn from "eslint-plugin-unicorn"

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))

export default [
  {
    ignores: ["build", "dev-dist"],
  },
  js.configs.recommended,
  unicorn.configs.recommended,
  prettier,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
      },
    },
    plugins: {
      import: importPlugin,
      promise,
      react,
      "react-compiler": reactCompiler,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      curly: ["error", "all"],
      "no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "operator-assignment": "error",
      "prefer-destructuring": [
        "error",
        {
          VariableDeclarator: {
            array: false,
            object: true,
          },
        },
      ],
      "prefer-template": "error",

      // Import rules
      "import/extensions": [
        "error",
        "never",
        {
          css: "always",
          json: "always",
        },
      ],
      "import/no-anonymous-default-export": "error",
      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      // Incompatible with the "@/" alias: the resolver maps it to a real path
      // outside the importing file's directory, so every aliased import is
      // flagged. The codebase has no relative parent imports by convention.
      "import/no-relative-parent-imports": "off",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          named: true,
          "newlines-between": "always",
        },
      ],
      "import/prefer-default-export": "warn",

      // Promise rules
      "promise/always-return": "error",
      "promise/catch-or-return": "error",
      "promise/no-nesting": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",

      // React rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-compiler/react-compiler": "error",
      "react/jsx-no-target-blank": "off",
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          reservedFirst: true,
          shorthandFirst: true,
          multiline: "last",
        },
      ],
      "react/no-unused-state": "warn",
      "react/prop-types": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // unicorn rules
      "unicorn/no-null": "off",
      "unicorn/prevent-abbreviations": "off",
    },
    settings: {
      react: { version: "detect" },
      // import-x reads this key by its own name regardless of the alias the
      // plugin is registered under. Without it the legacy "node" resolver is
      // used, which requires eslint-import-resolver-node and crashes the run.
      "import-x/resolver-next": [
        createNodeResolver({
          extensions: [".mjs", ".cjs", ".js", ".jsx", ".json", ".node"],
          alias: { "@": [path.resolve(rootDirectory, "./src")] },
        }),
      ],
    },
  },
  {
    files: ["src/**/*.jsx"],
    rules: {
      "unicorn/filename-case": ["error", { case: "pascalCase", ignore: ["^src$"] }],
    },
  },
  {
    files: ["src/components/Article/ArticleTOC.jsx", "src/main.jsx", "src/routes.jsx"],
    rules: {
      "unicorn/filename-case": "off",
    },
  },
  {
    files: ["src/hooks/**/*.js", "src/store/**/*.js"],
    rules: {
      "unicorn/filename-case": ["error", { case: "camelCase", ignore: ["^src$"] }],
    },
  },
  {
    // 这些文件遍历的是 html-react-parser 的 AST 节点（普通对象），
    // 并非真实 DOM，故 .firstElementChild / .querySelector 不适用。
    files: [
      "src/components/Article/ArticleBodyRenderer.jsx",
      "src/components/Article/ImageOverlayButton.jsx",
    ],
    rules: {
      "unicorn/better-dom-traversing": "off",
    },
  },
  {
    files: ["scripts/update-fonts.js"],
    languageOptions: { globals: globals.node },
    rules: {
      "unicorn/no-process-exit": "off",
    },
  },
]

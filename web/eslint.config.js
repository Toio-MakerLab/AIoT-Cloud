import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const ignores = ["dist", "node_modules", "src/components/ui"];

const languageOptions = {
	ecmaVersion: 2020,
	globals: globals.browser,
};

const plugins = {
	"react-hooks": reactHooks,
	"react-refresh": reactRefresh,
};

const rules = {
	...reactHooks.configs.recommended.rules,

	"react-refresh/only-export-components": [
		"warn",
		{ allowConstantExport: true },
	],

	"no-console": "error",

	// Disable base rule — TypeScript-aware version handles it below
	"no-unused-vars": "off",
	"@typescript-eslint/no-unused-vars": [
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
};

export default tseslint.config(
	{ ignores },
	{
		extends: [
			js.configs.recommended,
			...tseslint.configs.recommended,
			...pluginQuery.configs["flat/recommended"],
		],
		files: ["**/*.{ts,tsx}"],
		languageOptions,
		plugins,
		rules,
	},
);

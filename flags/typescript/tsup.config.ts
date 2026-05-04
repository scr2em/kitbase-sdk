import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			index: "src/index.ts",
			"server/index": "src/server/index.ts",
			"web/index": "src/web/index.ts",
		},
		format: ["cjs", "esm"],
		dts: true,
		sourcemap: true,
		clean: true,
		target: "es2022",
		splitting: false,
	},
	{
		entry: { index: "src/browser.ts" },
		format: ["iife"],
		globalName: "KitbaseFlags",
		noExternal: ["@openfeature/web-sdk"],
		minify: true,
		sourcemap: true,
		target: "es2020",
		splitting: false,
		dts: false,
	},
]);
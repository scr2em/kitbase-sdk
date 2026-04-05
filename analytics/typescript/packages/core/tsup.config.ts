import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const pkg = JSON.parse(
	readFileSync(
		resolve(dirname(fileURLToPath(import.meta.url)), "package.json"),
		"utf-8",
	),
) as { version: string };

const define = {
	__KITBASE_SDK_VERSION__: JSON.stringify(pkg.version),
};

export default defineConfig([
	// Full SDK (with offline queue support)
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		sourcemap: true,
		clean: true,
		target: "es2022",
		splitting: false,
		define,
	},
	// Lite SDK (without offline queue - smaller bundle, IIFE for script tags)
	{
		entry: { lite: "src/lite.ts" },
		platform: "browser",
		format: ["iife"],
		dts: false,
		sourcemap: false,
		clean: false, // Don't clean - would remove full SDK output
		target: "es2022",
		splitting: false,
		globalName: "Kitbase",
		minify: true,
		outExtension: () => ({ js: ".js" }),
		define,
	},
]);

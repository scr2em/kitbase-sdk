import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(
	readFileSync(
		resolve(dirname(fileURLToPath(import.meta.url)), "package.json"),
		"utf-8",
	),
) as { version: string };

export default defineConfig({
	define: {
		__KITBASE_SDK_VERSION__: JSON.stringify(pkg.version),
	},
	test: {
		globals: true,
		environment: "node",
	},
});

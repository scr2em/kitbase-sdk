import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
	},
	format: ["cjs", "esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	target: "es2022",
	external: ["react", "@kitbase/flags"],
	splitting: false,
});
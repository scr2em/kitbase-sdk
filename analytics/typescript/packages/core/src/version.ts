/**
 * Kitbase SDK version — injected at build time by tsup/vitest via the
 * `__KITBASE_SDK_VERSION__` define, sourced from this package's package.json.
 *
 * The fallback `"dev"` only applies in unexpected environments where the
 * define was not applied (e.g., ad-hoc tsc compilation).
 */
declare const __KITBASE_SDK_VERSION__: string | undefined;

export const SDK_VERSION: string =
	typeof __KITBASE_SDK_VERSION__ === "string" ? __KITBASE_SDK_VERSION__ : "dev";

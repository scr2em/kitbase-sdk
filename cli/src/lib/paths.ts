import os from "node:os";
import path from "node:path";

function resolveConfigDir(): string {
	if (process.platform === "win32") {
		const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
		return path.join(appData, "kitbase");
	}

	const xdgConfigHome = process.env.XDG_CONFIG_HOME;
	const base = xdgConfigHome && xdgConfigHome.length > 0 ? xdgConfigHome : path.join(os.homedir(), ".config");
	return path.join(base, "kitbase");
}

export const CONFIG_DIR = resolveConfigDir();
export const CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

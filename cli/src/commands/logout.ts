import chalk from "chalk";

import { BaseCommand } from "../base-command.js";
import { resolveBaseUrl } from "../lib/config.js";
import { logout } from "../lib/auth.js";

export default class Logout extends BaseCommand {
	static description = "Log out of Kitbase and revoke the local session.";

	async run(): Promise<void> {
		const { flags } = await this.parse(Logout);
		const baseUrl = resolveBaseUrl(flags);

		await logout(baseUrl);
		this.log(chalk.green(`Logged out of ${baseUrl}.`));
	}
}

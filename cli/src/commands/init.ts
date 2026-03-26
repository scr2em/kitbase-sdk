import { Flags } from "@oclif/core";
import chalk from "chalk";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

import { BaseCommand } from "../base-command.js";
import { configExists, writeConfig, getConfigPath, prompt } from "../lib/config.js";

export default class Init extends BaseCommand {
	static override description = "Initialize Kitbase CLI config in the current project";

	static override examples = [
		"<%= config.bin %> init",
		"<%= config.bin %> init --api-key sk_live_xxx",
		"<%= config.bin %> init --api-key sk_live_xxx --base-url https://api.mycompany.com",
	];

	static override flags = {
		"api-key": Flags.string({ char: "k", description: "SDK key to save" }),
		"base-url": Flags.string({
			description: "API base URL (for self-hosted instances)",
		}),
		force: Flags.boolean({ description: "Overwrite existing .kitbasecli", default: false }),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Init);

		if (configExists() && !flags.force) {
			this.log(chalk.yellow(`\n  .kitbasecli already exists at ${getConfigPath()}`));
			this.log(chalk.dim("  Use --force to overwrite.\n"));
			return;
		}

		let apiKey = flags["api-key"];
		let baseUrl = flags["base-url"];

		if (!apiKey) {
			this.log("\n  Set up your Kitbase project config.\n");
			this.log(chalk.dim("  Find your SDK key at: https://kitbase.dev/settings/api-keys\n"));

			apiKey = await prompt("  Paste your SDK key: ");

			if (!apiKey) {
				this.error("No SDK key provided.");
			}

			if (apiKey.length < 10) {
				this.error("Invalid SDK key format.");
			}
		}

		if (!baseUrl) {
			const customUrl = await prompt(
				`  API base URL ${chalk.dim("(press Enter for https://api.kitbase.dev)")}: `,
			);
			if (customUrl) {
				baseUrl = customUrl;
			}
		}

		writeConfig(apiKey, baseUrl);
		this.log(chalk.green(`\n  Created ${getConfigPath()}`));

		if (baseUrl) {
			this.log(chalk.dim(`  API URL: ${baseUrl}`));
		}

		// Auto-add to .gitignore if it exists and doesn't already contain .kitbasecli
		const gitignorePath = join(process.cwd(), ".gitignore");
		if (existsSync(gitignorePath)) {
			const content = readFileSync(gitignorePath, "utf-8");
			if (!content.includes(".kitbasecli")) {
				appendFileSync(gitignorePath, "\n# Kitbase CLI config\n.kitbasecli\n");
				this.log(chalk.dim("  Added .kitbasecli to .gitignore"));
			}
		} else {
			this.log(chalk.yellow("  Remember to add .kitbasecli to .gitignore!"));
		}

		this.log();
	}
}

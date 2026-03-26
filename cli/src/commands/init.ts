import { Flags } from "@oclif/core";
import chalk from "chalk";

import { BaseCommand } from "../base-command.js";
import { configExists, writeConfig, getConfigPath, ensureGitignore } from "../lib/config.js";
import { selectOne, inputText } from "../lib/prompts.js";

export default class Init extends BaseCommand {
	static override description = "Initialize Kitbase CLI config in the current project";

	static override examples = [
		"<%= config.bin %> init",
		"<%= config.bin %> init --local",
		"<%= config.bin %> init --api-key sk_live_xxx",
		"<%= config.bin %> init --api-key sk_live_xxx --base-url https://api.mycompany.com",
	];

	static override flags = {
		"api-key": Flags.string({ char: "k", description: "API key to save" }),
		"base-url": Flags.string({
			description: "API base URL (for self-hosted instances)",
		}),
		local: Flags.boolean({
			char: "l",
			description: "Use a local backend API (prompts for URL)",
			default: false,
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

		// If flags cover everything, skip interactive flow
		const isNonInteractive = apiKey !== undefined;

		if (!isNonInteractive) {
			this.log("\n  Set up your Kitbase project config.\n");

			if (flags.local) {
				if (!baseUrl) {
					baseUrl = await inputText("Enter your local API base URL", {
						default: "http://localhost:8080",
						required: true,
					});
				}
			} else {
				const hosting = await selectOne("How are you running Kitbase?", [
					{ name: "Kitbase Cloud", value: "cloud", description: "Hosted at kitbase.dev" },
					{ name: "Self-hosted", value: "self-hosted", description: "Your own server" },
				]);

				if (hosting === "self-hosted" && !baseUrl) {
					baseUrl = await inputText("Enter your API base URL", { required: true });
				}
			}

			apiKey = await inputText("Paste your API key", {
				validate: (v) => {
					if (!v) return "API key is required";
					if (v.length < 10) return "Invalid API key format";
					return true;
				},
			});
		}

		writeConfig(apiKey!, baseUrl);
		this.log(chalk.green(`\n  Created ${getConfigPath()}`));

		if (baseUrl) {
			this.log(chalk.dim(`  API URL: ${baseUrl}`));
		}

		const { created, added } = ensureGitignore();
		if (created) {
			this.log(chalk.dim("  Created .gitignore with .kitbasecli"));
		} else if (added) {
			this.log(chalk.dim("  Added .kitbasecli to .gitignore"));
		}

		this.log();
	}
}

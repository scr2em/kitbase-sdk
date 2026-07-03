import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import { config as loadEnv } from "dotenv";

import { ApiError, AuthenticationError, KitbaseError } from "./lib/errors.js";

// Load .env on import
loadEnv();

export abstract class BaseCommand extends Command {
	static baseFlags = {
		json: Flags.boolean({ description: "Output raw JSON instead of a formatted table.", default: false }),
		"base-url": Flags.string({ description: "Override the API base URL.", helpGroup: "GLOBAL" }),
		local: Flags.boolean({ description: "Shorthand for --base-url http://localhost:8100/api.", default: false, helpGroup: "GLOBAL" }),
		"api-key": Flags.string({ description: "Private API key (sk_kitbase_...) for non-interactive auth.", helpGroup: "GLOBAL" }),
		org: Flags.string({ description: "Organization slug to operate in.", helpGroup: "GLOBAL" }),
		project: Flags.string({ description: "Project id to operate in.", helpGroup: "GLOBAL" }),
	};

	protected async catch(error: unknown): Promise<any> {
		if (error instanceof AuthenticationError) {
			this.log(chalk.red("Authentication error: ") + error.message);
			this.log(chalk.dim("Run `kitbase login` to sign in again."));
			this.exit(3);
		}

		if (error instanceof ApiError) {
			this.log(chalk.red(`API error (${error.statusCode}): `) + error.message);
			this.exit(1);
		}

		if (error instanceof KitbaseError) {
			this.log(chalk.red("Error: ") + error.message);
			this.exit(error.name === "ConfigurationError" || error.name === "ValidationError" ? 2 : 1);
		}

		return super.catch(error as Error);
	}
}

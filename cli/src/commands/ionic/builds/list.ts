import { Flags } from "@oclif/core";
import chalk from "chalk";
import ora from "ora";

import { BaseCommand } from "../../../base-command.js";
import { getApiKey, getBaseUrl } from "../../../lib/config.js";
import { createApiClient, createCliClient } from "../../../lib/api-client.js";
import {
	ConfigurationError,
	AuthenticationError,
	ApiError,
} from "../../../lib/errors.js";

export default class BuildsList extends BaseCommand {
	static override description = "List builds for the current project";

	static override examples = [
		"<%= config.bin %> ionic builds list",
		"<%= config.bin %> ionic builds list --page 1",
		"<%= config.bin %> ionic builds list --size 10",
	];

	static override flags = {
		"api-key": Flags.string({
			char: "k",
			description: "API key for authentication",
		}),
		"base-url": Flags.string({
			description: "Override API base URL",
		}),
		page: Flags.integer({
			description: "Page number (0-based)",
			default: 0,
		}),
		size: Flags.integer({
			description: "Items per page",
			default: 20,
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(BuildsList);
		const spinner = ora();

		try {
			const apiKey = await getApiKey({ interactive: true, cliApiKey: flags["api-key"] });
			if (!apiKey) {
				throw new ConfigurationError("API key is required. Run `kitbase init` to configure.");
			}

			const baseUrl = getBaseUrl(flags["base-url"]);

			spinner.start("Resolving project info...");
			const cliClient = createCliClient(apiKey, baseUrl);
			const { data: keyInfo, error: keyError, response: keyRes } = await cliClient.GET("/api/v1/auth/key-info", {
				params: { header: { "X-API-Key": apiKey } },
			});
			if (keyError) {
				const status = keyRes.status;
				if (status === 401 || status === 403) throw new AuthenticationError("Invalid API key", `${baseUrl}/api/v1/auth/key-info`);
				throw new ApiError("Failed to fetch key info", status, keyError, `${baseUrl}/api/v1/auth/key-info`);
			}
			spinner.succeed(`Project: ${chalk.dim(keyInfo.orgSlug)} / ${chalk.dim(keyInfo.projectId)}`);

			spinner.start("Loading builds...");
			const apiClient = createApiClient(apiKey, baseUrl);
			const { data, error, response } = await apiClient.GET("/{orgSlug}/projects/{projectId}/builds", {
				params: {
					path: { orgSlug: keyInfo.orgSlug, projectId: keyInfo.projectId },
					query: { page: flags.page, size: flags.size, sort: "desc" },
				},
			});

			if (error) {
				throw new ApiError("Failed to fetch builds", response.status, error, `${baseUrl}/builds`);
			}
			spinner.stop();

			if (data.data.length === 0) {
				this.log(chalk.yellow("\n  No builds found.\n"));
				return;
			}

			// Table header
			this.log();
			this.log(
				chalk.bold("  Commit".padEnd(12)) +
				chalk.bold("Branch".padEnd(22)) +
				chalk.bold("Version".padEnd(12)) +
				chalk.bold("Size".padEnd(12)) +
				chalk.bold("Created At"),
			);
			this.log(chalk.dim("  " + "─".repeat(78)));

			for (const build of data.data) {
				const commit = build.commitHash.substring(0, 7);
				const branch = truncate(build.branchName, 20);
				const version = build.nativeVersion;
				const size = formatSize(build.buildSize);
				const created = formatDate(build.createdAt);

				this.log(
					`  ${chalk.cyan(commit.padEnd(12))}` +
					`${branch.padEnd(22)}` +
					`${version.padEnd(12)}` +
					`${chalk.dim(size.padEnd(12))}` +
					`${chalk.dim(created)}`,
				);
			}

			this.log();
			this.log(chalk.dim(`  Page ${data.page + 1} of ${data.totalPages} (${data.totalElements} total)`));
			this.log();
		} catch (error) {
			spinner.stop();
			if (error instanceof AuthenticationError) this.error(`Authentication Error: ${error.message}`);
			if (error instanceof ApiError) this.error(`API Error (${error.statusCode}): ${error.message}`);
			if (error instanceof ConfigurationError) this.error(`Configuration Error: ${error.message}`);
			if (error instanceof Error) this.error(error.message);
			this.error("An unknown error occurred");
		}
	}
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
		+ " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function truncate(str: string, max: number): string {
	return str.length > max ? str.substring(0, max - 1) + "…" : str;
}

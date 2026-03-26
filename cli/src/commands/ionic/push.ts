import { Flags } from "@oclif/core";
import chalk from "chalk";
import ora from "ora";

import { BaseCommand } from "../../base-command.js";
import { getGitInfo, isGitRepository } from "../../lib/git.js";
import { getApiKey } from "../../lib/config.js";
import {
	KitbaseError,
	ConfigurationError,
	AuthenticationError,
	ApiError,
	BuildError,
	GitError,
	ValidationError,
} from "../../lib/errors.js";
import {
	buildAndZip,
	getNativeVersion,
	validateZipFile,
	cleanupTemp,
	isIonicProject,
} from "../../ionic/build.js";
import { UploadClient, createUploadPayload } from "../../ionic/upload.js";

export default class Push extends BaseCommand {
	static override description = "Build and upload your web app to Kitbase for OTA updates";

	static override examples = [
		"<%= config.bin %> push",
		"<%= config.bin %> push --skip-build",
		"<%= config.bin %> push --file ./build.zip --version 1.0.0",
		"<%= config.bin %> push --api-key sk_live_xxx --skip-build",
	];

	static override flags = {
		"skip-build": Flags.boolean({
			char: "s",
			description: "Skip building and use existing build output",
			default: false,
		}),
		"output-dir": Flags.string({
			char: "o",
			description: "Custom web build output directory (default: www, dist, or build)",
		}),
		file: Flags.string({
			char: "f",
			description: "Path to an existing zip file to upload (skips build)",
		}),
		version: Flags.string({
			char: "v",
			description: "Override app version",
		}),
		"api-key": Flags.string({
			char: "k",
			description: "SDK key for authentication",
		}),
		"base-url": Flags.string({
			description: "Override API base URL",
		}),
		commit: Flags.string({
			description: "Override git commit hash",
		}),
		branch: Flags.string({
			description: "Override git branch name",
		}),
		message: Flags.string({
			description: "Override git commit message",
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Push);
		const spinner = ora();

		try {
			this.log(chalk.bold.cyan("\n  Kitbase Push\n"));

			// 1. Resolve API key
			const apiKey = await getApiKey({ interactive: true, cliApiKey: flags["api-key"] });
			if (!apiKey) {
				throw new ConfigurationError(
					"API key is required.\n" +
						"Set it via:\n" +
						"  1. --api-key flag\n" +
						"  2. .kitbasecli file with KITBASE_API_KEY=your_key\n" +
						"  3. KITBASE_API_KEY environment variable\n" +
						"  4. KITBASE_API_KEY in .env file",
				);
			}

			// 2. Warn if not an Ionic project
			if (!flags.file && !isIonicProject()) {
				this.log(chalk.yellow("  Warning: This does not appear to be an Ionic project.\n"));
			}

			// 3. Collect git info
			spinner.start("Collecting git information...");

			let gitInfo: { commitHash: string; branchName: string; commitMessage?: string };

			if (flags.commit && flags.branch) {
				gitInfo = {
					commitHash: flags.commit,
					branchName: flags.branch,
					commitMessage: flags.message,
				};
			} else {
				if (!isGitRepository()) {
					spinner.fail("Not a git repository");
					throw new GitError(
						"Not a git repository. Run from a git repo or provide --commit and --branch.",
					);
				}

				const collected = getGitInfo();
				gitInfo = {
					commitHash: flags.commit || collected.commitHash,
					branchName: flags.branch || collected.branchName,
					commitMessage: flags.message || collected.commitMessage,
				};
			}

			spinner.succeed(
				`Git: ${chalk.dim(gitInfo.branchName)} @ ${chalk.dim(gitInfo.commitHash.substring(0, 7))}`,
			);

			// 4. Resolve version
			spinner.start("Getting version...");
			let nativeVersion: string;
			try {
				nativeVersion = flags.version || getNativeVersion();
			} catch {
				if (flags.version) {
					nativeVersion = flags.version;
				} else {
					spinner.fail("Could not determine version");
					throw new ValidationError("Could not determine version. Use --version flag.");
				}
			}

			spinner.succeed(`Version: ${chalk.dim(nativeVersion)}`);

			// 5. Build or use existing zip
			let zipFilePath: string;
			let zipSize: number;

			if (flags.file) {
				spinner.start("Validating zip file...");
				validateZipFile(flags.file);
				const { statSync } = await import("node:fs");
				zipSize = statSync(flags.file).size;
				zipFilePath = flags.file;
				spinner.succeed(
					`Using zip: ${chalk.dim(zipFilePath)} ${chalk.cyan(`(${formatSize(zipSize)})`)}`,
				);
			} else {
				spinner.stop();
				const result = await buildAndZip({
					skipBuild: flags["skip-build"],
					outputDir: flags["output-dir"],
				});
				zipFilePath = result.zipPath;
				zipSize = result.zipSize;
				spinner.succeed(
					`Build zipped: ${chalk.dim(zipFilePath)} ${chalk.cyan(`(${formatSize(zipSize)})`)}`,
				);
			}

			// 6. Upload
			const client = new UploadClient({ apiKey, baseUrl: flags["base-url"] });
			const payload = createUploadPayload(zipFilePath, gitInfo, nativeVersion);

			this.log(chalk.dim("\n  Commit:  ") + chalk.white(payload.commitHash));
			this.log(chalk.dim("  Branch:  ") + chalk.white(payload.branchName));
			this.log(chalk.dim("  Version: ") + chalk.white(payload.nativeVersion));
			this.log(
				chalk.dim("  File:    ") +
					chalk.white(`${payload.fileName} (${formatSize(payload.file.length)})`),
			);
			this.log();

			spinner.start("Uploading to Kitbase... 0%");

			const response = await client.upload(payload, {
				onProgress(progress) {
					const bar = progressBar(progress.percent);
					spinner.text = `Uploading to Kitbase... ${bar} ${progress.percent}% (${formatSize(progress.uploaded)}/${formatSize(progress.total)})`;
				},
			});

			spinner.succeed("Build uploaded successfully!");

			if (!flags.file) cleanupTemp();

			this.log(chalk.bold.green("\n  Push complete!\n"));
			if (response.buildId) this.log(chalk.dim(`Build ID: ${response.buildId}`));
			if (response.message) this.log(chalk.dim(response.message));
			this.log();
		} catch (error) {
			spinner.stop();
			cleanupTemp();
			this.error(formatError(error));
		}
	}
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function progressBar(percent: number, width = 20): string {
	const filled = Math.round((percent / 100) * width);
	return chalk.cyan("\u2588".repeat(filled)) + chalk.gray("\u2591".repeat(width - filled));
}

function formatError(error: unknown): string {
	if (error instanceof AuthenticationError) {
		return (
			`Authentication Error: ${error.message}\n\n` +
			"This usually means:\n" +
			"  - The SDK key does not exist or was deleted\n" +
			"  - The SDK key is for a different environment\n" +
			"  - The SDK key was copied incorrectly\n\n" +
			"Create a new SDK key from the dashboard and try again."
		);
	}

	if (error instanceof ApiError) return `API Error (${error.statusCode}): ${error.message}`;
	if (error instanceof BuildError) return `Build Error: ${error.message}`;
	if (error instanceof GitError) return `Git Error: ${error.message}`;
	if (error instanceof ValidationError) return `Validation Error: ${error.message}`;
	if (error instanceof ConfigurationError) return `Configuration Error: ${error.message}`;
	if (error instanceof KitbaseError) return error.message;
	if (error instanceof Error) return error.message;
	return "An unknown error occurred";
}
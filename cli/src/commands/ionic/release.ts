import { Flags } from "@oclif/core";
import chalk from "chalk";
import ora from "ora";

import { BaseCommand } from "../../base-command.js";
import { getApiKey, getBaseUrl } from "../../lib/config.js";
import { createApiClient } from "../../lib/api-client.js";
import { selectOne, inputText } from "../../lib/prompts.js";
import {
	KitbaseError,
	ConfigurationError,
	AuthenticationError,
	ApiError,
	ValidationError,
} from "../../lib/errors.js";
import { UploadClient } from "../../ionic/upload.js";
import type { components } from "../../generated/api.js";

type BuildResponse = components["schemas"]["BuildResponse"];
type EnvironmentResponse = components["schemas"]["EnvironmentResponse"];

const UPDATE_MODES = ["force", "silent", "prompt"] as const;
const TARGET_PLATFORMS = ["ios", "android", "both"] as const;

export default class Release extends BaseCommand {
	static override description = "Create an OTA update from an existing build";

	static override examples = [
		"<%= config.bin %> ionic release",
		"<%= config.bin %> ionic release --api-key sk_kitbase_xxx",
		'<%= config.bin %> ionic release --build-id abc123 --env production --name "v1.2.0 hotfix" --version 1.2.0 --min-version 1.0.0 --update-mode force --platform both',
	];

	static override flags = {
		"api-key": Flags.string({
			char: "k",
			description: "API key for authentication",
		}),
		"base-url": Flags.string({
			description: "Override API base URL",
		}),
		"build-id": Flags.string({
			char: "b",
			description: "Build ID to release (skips build selection prompt)",
		}),
		env: Flags.string({
			char: "e",
			description: "Target environment name (skips environment selection prompt)",
		}),
		name: Flags.string({
			char: "n",
			description: "Release name",
		}),
		version: Flags.string({
			char: "v",
			description: "Version string (e.g., 1.2.0)",
		}),
		"min-version": Flags.string({
			description: "Minimum native version required (e.g., 1.0.0)",
		}),
		"update-mode": Flags.string({
			char: "m",
			description: "Update mode: force, silent, or prompt",
			options: [...UPDATE_MODES],
		}),
		platform: Flags.string({
			char: "p",
			description: "Target platform: ios, android, or both",
			options: [...TARGET_PLATFORMS],
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Release);
		const spinner = ora();

		try {
			this.log(chalk.bold.cyan("\n  Kitbase Release\n"));

			// 1. Resolve API key
			const apiKey = await getApiKey({ interactive: true, cliApiKey: flags["api-key"] });
			if (!apiKey) {
				throw new ConfigurationError(
					"A secret API key (sk_kitbase_*) is required.\n" +
						"Set it via:\n" +
						"  1. --api-key flag\n" +
						"  2. .kitbasecli file with KITBASE_API_KEY=your_key\n" +
						"  3. KITBASE_API_KEY environment variable\n" +
						"  4. KITBASE_API_KEY in .env file",
				);
			}

			// 2. Resolve project info
			const baseUrl = getBaseUrl(flags["base-url"]);
			const cliClient = new UploadClient({ apiKey, baseUrl });
			const api = createApiClient(apiKey, baseUrl);

			spinner.start("Resolving project info...");
			const keyInfo = await cliClient.fetchKeyInfo();
			spinner.succeed(`Project: ${chalk.dim(keyInfo.orgSlug)} / ${chalk.dim(keyInfo.projectId)}`);

			const pathParams = { orgSlug: keyInfo.orgSlug, projectId: keyInfo.projectId };

			// 3. Resolve build
			let selectedBuild: BuildResponse;

			if (flags["build-id"]) {
				// Use build ID directly — still fetch to validate it exists and get metadata
				spinner.start("Validating build...");
				const { data: buildsData, error: buildsError } = await api.GET(
					"/{orgSlug}/projects/{projectId}/builds",
					{ params: { path: pathParams, query: { size: 100, sort: "desc" } } },
				);
				if (buildsError || !buildsData) {
					spinner.fail("Failed to load builds");
					throw new ApiError("Failed to fetch builds", 0);
				}
				const match = buildsData.data.find((b) => b.id === flags["build-id"]);
				if (!match) {
					spinner.fail("Build not found");
					throw new ValidationError(`Build "${flags["build-id"]}" not found in this project`);
				}
				selectedBuild = match;
				spinner.succeed(`Build: ${chalk.dim(`${selectedBuild.commitHash.substring(0, 7)} — v${selectedBuild.nativeVersion}`)}`);
			} else {
				spinner.start("Loading builds...");
				const { data: buildsData, error: buildsError } = await api.GET(
					"/{orgSlug}/projects/{projectId}/builds",
					{ params: { path: pathParams, query: { size: 10, sort: "desc" } } },
				);
				if (buildsError || !buildsData) {
					spinner.fail("Failed to load builds");
					throw new ApiError("Failed to fetch builds", 0);
				}
				spinner.stop();

				if (buildsData.data.length === 0) {
					throw new ConfigurationError(
						"No builds found for this project. Push a build first with: kitbase ionic push",
					);
				}

				selectedBuild = await selectOne<BuildResponse>(
					"Select a build",
					buildsData.data.map((b) => ({
						name: `${b.branchName} @ ${b.commitHash.substring(0, 7)} — v${b.nativeVersion} (${formatDate(b.createdAt)})`,
						value: b,
						description: b.commitMessage || undefined,
					})),
				);
				this.log(chalk.green("  Build: ") + chalk.dim(`${selectedBuild.commitHash.substring(0, 7)} — v${selectedBuild.nativeVersion}`));
			}

			// 4. Resolve environment
			spinner.start("Loading environments...");
			const { data: envsData, error: envsError } = await api.GET(
				"/{orgSlug}/projects/{projectId}/environments",
				{ params: { path: pathParams } },
			);
			if (envsError || !envsData) {
				spinner.fail("Failed to load environments");
				throw new ApiError("Failed to fetch environments", 0);
			}
			spinner.stop();

			if (envsData.data.length === 0) {
				throw new ConfigurationError(
					"No environments found for this project. Create one in the dashboard first.",
				);
			}

			let selectedEnv: EnvironmentResponse;

			if (flags.env) {
				const match = envsData.data.find(
					(e) => e.name.toLowerCase() === flags.env!.toLowerCase(),
				);
				if (!match) {
					const available = envsData.data.map((e) => e.name).join(", ");
					throw new ValidationError(
						`Environment "${flags.env}" not found. Available: ${available}`,
					);
				}
				selectedEnv = match;
			} else if (envsData.data.length === 1) {
				selectedEnv = envsData.data[0];
			} else {
				selectedEnv = await selectOne<EnvironmentResponse>(
					"Select target environment",
					envsData.data.map((e) => ({ name: e.name, value: e })),
				);
			}

			this.log(chalk.green("  Environment: ") + chalk.dim(selectedEnv.name));

			// 5. Resolve release details (flags or prompts)
			const name = flags.name ?? await inputText("Release name", { required: true });

			const version = flags.version ?? await inputText("Version", {
				default: selectedBuild.nativeVersion,
				required: true,
			});

			const minNativeVersion = flags["min-version"] ?? await inputText("Minimum native version", {
				default: selectedBuild.nativeVersion,
				required: true,
			});

			const updateMode = (flags["update-mode"] as typeof UPDATE_MODES[number]) ?? await selectOne<"force" | "silent" | "prompt">(
				"Update mode",
				[
					{ name: "Force — applied immediately, user cannot skip", value: "force" as const },
					{ name: "Silent — applied in the background", value: "silent" as const },
					{ name: "Prompt — user is asked to update", value: "prompt" as const },
				],
			);

			const targetPlatform = (flags.platform as typeof TARGET_PLATFORMS[number]) ?? await selectOne<"ios" | "android" | "both">(
				"Target platform",
				[
					{ name: "Both (iOS & Android)", value: "both" as const },
					{ name: "iOS only", value: "ios" as const },
					{ name: "Android only", value: "android" as const },
				],
			);

			// 6. Confirm and create
			this.log(chalk.dim("\n  ── Summary ──────────────────────────"));
			this.log(chalk.dim("  Name:        ") + chalk.white(name));
			this.log(chalk.dim("  Version:     ") + chalk.white(version));
			this.log(chalk.dim("  Min Version: ") + chalk.white(minNativeVersion));
			this.log(chalk.dim("  Update Mode: ") + chalk.white(updateMode));
			this.log(chalk.dim("  Platform:    ") + chalk.white(targetPlatform));
			this.log(chalk.dim("  Environment: ") + chalk.white(selectedEnv.name));
			this.log(chalk.dim("  Build:       ") + chalk.white(`${selectedBuild.commitHash.substring(0, 7)} — ${selectedBuild.branchName}`));
			this.log();

			spinner.start("Creating OTA update...");
			const { data: otaData, error: otaError } = await api.POST(
				"/{orgSlug}/projects/{projectId}/ota-updates",
				{
					params: { path: pathParams },
					body: {
						name,
						version,
						buildId: selectedBuild.id,
						environmentId: selectedEnv.id,
						minNativeVersion,
						updateMode,
						targetPlatform,
					},
				},
			);

			if (otaError || !otaData) {
				spinner.fail("Failed to create OTA update");
				throw new ApiError("Failed to create OTA update", 0);
			}
			spinner.succeed("OTA update created!");

			this.log(chalk.bold.green("\n  Release complete!\n"));
			this.log(chalk.dim(`  OTA Update ID: ${otaData.id}`));
			this.log();
		} catch (error) {
			spinner.stop();
			this.error(formatError(error));
		}
	}
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatError(error: unknown): string {
	if (error instanceof AuthenticationError) {
		return `Authentication Error: ${error.message}`;
	}
	if (error instanceof ApiError) return `API Error (${error.statusCode}): ${error.message}`;
	if (error instanceof ValidationError) return `Validation Error: ${error.message}`;
	if (error instanceof ConfigurationError) return `Configuration Error: ${error.message}`;
	if (error instanceof KitbaseError) return error.message;
	if (error instanceof Error) return error.message;
	return "An unknown error occurred";
}

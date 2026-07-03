import { Args } from "@oclif/core";
import chalk from "chalk";

import { BaseCommand } from "../../base-command.js";
import { createApiClient, unwrapResponse } from "../../lib/api.js";
import { resolveBaseUrl, setContext } from "../../lib/config.js";
import { resolveOrg } from "../../lib/context.js";
import { selectOne } from "../../lib/prompts.js";

export default class UseProject extends BaseCommand {
	static description = "Set the default project to use for this API endpoint.";
	static args = {
		id: Args.string({ description: "Project id", required: false }),
	};

	async run(): Promise<void> {
		const { args, flags } = await this.parse(UseProject);
		const baseUrl = resolveBaseUrl(flags);
		const orgSlug = await resolveOrg(flags);

		let projectId = args.id;
		if (!projectId) {
			const { client } = createApiClient({
				baseUrl: flags["base-url"],
				local: flags.local,
				apiKey: flags["api-key"],
			});
			const projects = unwrapResponse(
				await client.GET("/{orgSlug}/projects", { params: { path: { orgSlug } } }),
			);
			if (projects.length === 0) {
				this.error(`No projects found in organization "${orgSlug}".`);
			}
			projectId = await selectOne(
				"Select a project",
				projects.map((project) => ({ name: project.name, value: project.id })),
			);
		}

		setContext(baseUrl, { project: projectId });
		this.log(chalk.green(`Default project set to ${projectId}.`));
	}
}

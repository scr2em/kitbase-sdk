import { Args } from "@oclif/core";
import chalk from "chalk";

import { BaseCommand } from "../../base-command.js";
import { createApiClient, unwrapResponse } from "../../lib/api.js";
import { resolveBaseUrl, setContext } from "../../lib/config.js";
import { selectOne } from "../../lib/prompts.js";

export default class UseOrg extends BaseCommand {
	static description = "Set the default organization to use for this API endpoint.";
	static args = {
		slug: Args.string({ description: "Organization slug", required: false }),
	};

	async run(): Promise<void> {
		const { args, flags } = await this.parse(UseOrg);
		const baseUrl = resolveBaseUrl(flags);

		let slug = args.slug;
		if (!slug) {
			const { client } = createApiClient({
				baseUrl: flags["base-url"],
				local: flags.local,
				apiKey: flags["api-key"],
			});
			const orgs = unwrapResponse(await client.GET("/organizations"));
			if (orgs.length === 0) {
				this.error("You don't belong to any organization yet.");
			}
			slug = await selectOne(
				"Select an organization",
				orgs.map((org) => ({ name: `${org.name} (${org.orgSlug})`, value: org.orgSlug })),
			);
		}

		setContext(baseUrl, { org: slug });
		this.log(chalk.green(`Default organization set to ${slug}.`));
	}
}

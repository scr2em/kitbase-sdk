import { BaseCommand } from "../base-command.js";
import { resolveBaseUrl, getContext } from "../lib/config.js";
import { getCredentials } from "../lib/credentials.js";
import { printResult } from "../lib/output.js";

export default class Context extends BaseCommand {
	static description = "Show the current base URL, auth mode, organization, and project.";

	async run(): Promise<void> {
		const { flags } = await this.parse(Context);
		const baseUrl = resolveBaseUrl(flags);
		const apiKey = flags["api-key"] ?? process.env.KITBASE_API_KEY;
		const context = getContext(baseUrl);

		const authMode = apiKey ? "api-key" : getCredentials(baseUrl) ? "session" : "logged-out";

		printResult(
			{
				baseUrl,
				authMode,
				org: context.org ?? null,
				project: context.project ?? null,
			},
			{ json: flags.json },
		);
	}
}

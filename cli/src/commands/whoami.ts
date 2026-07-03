import { BaseCommand } from "../base-command.js";
import { resolveBaseUrl } from "../lib/config.js";
import { createApiClient, unwrapResponse } from "../lib/api.js";
import { getCredentials } from "../lib/credentials.js";
import { decodeAccessToken } from "../lib/jwt.js";
import { printResult } from "../lib/output.js";
import { AuthenticationError } from "../lib/errors.js";

export default class Whoami extends BaseCommand {
	static description = "Show the currently logged-in user.";

	async run(): Promise<void> {
		const { flags } = await this.parse(Whoami);
		const baseUrl = resolveBaseUrl(flags);
		const apiKey = flags["api-key"] ?? process.env.KITBASE_API_KEY;

		if (apiKey) {
			const { client } = createApiClient({ baseUrl, apiKey });
			const result = await client.GET("/api/v1/auth/key-info", {
				params: { header: { "X-API-Key": apiKey } },
			});
			printResult(unwrapResponse(result), { json: flags.json });
			return;
		}

		const credentials = getCredentials(baseUrl);
		if (!credentials) {
			throw new AuthenticationError("Not logged in. Run `kitbase login` first.");
		}

		const decoded = decodeAccessToken(credentials.accessToken);
		printResult(
			{
				email: credentials.userEmail ?? decoded?.email,
				userId: decoded?.sub,
				impersonatedBy: decoded?.impersonatedBy,
				baseUrl,
			},
			{ json: flags.json },
		);
	}
}

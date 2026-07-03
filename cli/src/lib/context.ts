import { createApiClient, unwrapResponse } from "./api.js";
import { resolveBaseUrl, getContext, setContext, type BaseUrlFlags } from "./config.js";
import { ConfigurationError } from "./errors.js";
import { selectOne } from "./prompts.js";

export interface ContextFlags extends BaseUrlFlags {
	apiKey?: string;
	org?: string;
	project?: string;
}

interface KeyInfo {
	projectId: string;
	organizationId: string;
	orgSlug: string;
}

// A private API key always resolves to exactly one project/org — cache the lookup per
// process run so resolving both org and project doesn't double the network calls.
const keyInfoCache = new Map<string, Promise<KeyInfo>>();

function apiKeyFor(flags: ContextFlags): string | undefined {
	return flags.apiKey ?? process.env.KITBASE_API_KEY;
}

async function fetchKeyInfo(baseUrl: string, apiKey: string): Promise<KeyInfo> {
	const cacheKey = `${baseUrl}:${apiKey}`;
	let cached = keyInfoCache.get(cacheKey);
	if (!cached) {
		cached = (async () => {
			const { client } = createApiClient({ baseUrl, apiKey });
			const result = await client.GET("/api/v1/auth/key-info", {
				params: { header: { "X-API-Key": apiKey } },
			});
			return unwrapResponse(result);
		})();
		keyInfoCache.set(cacheKey, cached);
	}
	return cached;
}

export async function resolveOrg(flags: ContextFlags): Promise<string> {
	if (flags.org) return flags.org;
	if (process.env.KITBASE_ORG) return process.env.KITBASE_ORG;

	const baseUrl = resolveBaseUrl(flags);
	const saved = getContext(baseUrl).org;
	if (saved) return saved;

	const apiKey = apiKeyFor(flags);
	if (apiKey) {
		return (await fetchKeyInfo(baseUrl, apiKey)).orgSlug;
	}

	if (!process.stdout.isTTY) {
		throw new ConfigurationError(
			"No organization selected. Run `kitbase use org <slug>` or pass --org.",
		);
	}

	const { client } = createApiClient(flags);
	const orgs = unwrapResponse(await client.GET("/organizations"));
	if (orgs.length === 0) {
		throw new ConfigurationError("You don't belong to any organization yet.");
	}
	const choice = await selectOne(
		"Select an organization",
		orgs.map((org) => ({ name: `${org.name} (${org.orgSlug})`, value: org.orgSlug })),
	);
	setContext(baseUrl, { org: choice });
	return choice;
}

export async function resolveProject(flags: ContextFlags, orgSlug: string): Promise<string> {
	if (flags.project) return flags.project;
	if (process.env.KITBASE_PROJECT) return process.env.KITBASE_PROJECT;

	const baseUrl = resolveBaseUrl(flags);
	const saved = getContext(baseUrl).project;
	if (saved) return saved;

	const apiKey = apiKeyFor(flags);
	if (apiKey) {
		return (await fetchKeyInfo(baseUrl, apiKey)).projectId;
	}

	if (!process.stdout.isTTY) {
		throw new ConfigurationError(
			"No project selected. Run `kitbase use project <id>` or pass --project.",
		);
	}

	const { client } = createApiClient(flags);
	const projects = unwrapResponse(
		await client.GET("/{orgSlug}/projects", { params: { path: { orgSlug } } }),
	);
	if (projects.length === 0) {
		throw new ConfigurationError(`No projects found in organization "${orgSlug}".`);
	}
	const choice = await selectOne(
		"Select a project",
		projects.map((project) => ({ name: project.name, value: project.id })),
	);
	setContext(baseUrl, { project: choice });
	return choice;
}

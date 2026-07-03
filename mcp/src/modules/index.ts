import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVICE_NAME, SERVICE_VERSION } from "../config.js";
import { makeCallApi, makeWithClient, type GetToken, type ToolContext } from "./helpers.js";
import { registerDiscoveryTools } from "./discovery.js";
import { registerWebAnalyticsTools } from "./web-analytics.js";
import { registerEventsTools } from "./events.js";
import { registerAiVisibilityTools } from "./ai-visibility.js";
import { registerBotsTools } from "./bots.js";
import { registerSessionsTools } from "./sessions.js";
import { registerUsersTools } from "./users.js";
import { registerSdkKeysTools } from "./sdk-keys.js";

// Every module is a `register…Tools(server, ctx)` function. They all share one
// server behind the single /mcp endpoint (or the stdio transport) and one auth
// session. `getToken` is the only thing that differs between transports: HTTP
// reads the bearer token off the request, stdio resolves it from local creds.
const MODULES: ReadonlyArray<(server: McpServer, ctx: ToolContext) => void> = [
	registerDiscoveryTools,
	registerWebAnalyticsTools,
	registerEventsTools,
	registerAiVisibilityTools,
	registerBotsTools,
	registerSessionsTools,
	registerUsersTools,
	registerSdkKeysTools,
];

export function buildServer(getToken: GetToken): McpServer {
	const server = new McpServer({ name: SERVICE_NAME, version: SERVICE_VERSION });
	const ctx: ToolContext = { callApi: makeCallApi(getToken), withClient: makeWithClient(getToken) };
	for (const registerModule of MODULES) {
		registerModule(server, ctx);
	}
	return server;
}

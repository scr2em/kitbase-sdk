import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createKitbaseClient, formatApiError, type FetchResult, type KitbaseClient } from "../api/client.js";
import { errorResult, jsonResult } from "../lib/render.js";

// The subset of the MCP tool-callback `extra` we care about: the bearer token
// is attached by the OAuth bearer-auth middleware in HTTP mode.
export interface ToolExtra {
	authInfo?: { token?: string };
}

/** Resolves the bearer token for a request. HTTP mode reads it off authInfo;
 *  stdio mode resolves it from local credentials (may throw for guidance). */
export type GetToken = (extra: ToolExtra) => Promise<string | undefined>;

/** Passed to every module's register function. */
export interface ToolContext {
	callApi: CallApi;
	withClient: WithClient;
}

/** Runs one typed API call end-to-end: resolve token → build client → call →
 *  render. Every non-2xx or transport failure becomes a recoverable error
 *  result rather than a thrown exception. */
export type CallApi = <T>(
	extra: ToolExtra,
	fn: (client: KitbaseClient) => Promise<FetchResult<T>>,
) => Promise<CallToolResult>;

/** Like CallApi but hands the whole client to the callback, which composes its
 *  own calls and returns the final result. Use for tools that hit more than one
 *  endpoint (e.g. discovery). Token/transport errors are still handled here. */
export type WithClient = (
	extra: ToolExtra,
	fn: (client: KitbaseClient) => Promise<CallToolResult>,
) => Promise<CallToolResult>;

export function makeWithClient(getToken: GetToken): WithClient {
	return async (extra, fn) => {
		let token: string | undefined;
		try {
			token = await getToken(extra);
		} catch (err) {
			return errorResult(err instanceof Error ? err.message : "Authentication failed.");
		}
		if (!token) {
			return errorResult("Not authenticated. Connect the Kitbase account, or run `kitbase login` for local use.");
		}
		try {
			return await fn(createKitbaseClient(token));
		} catch (err) {
			return errorResult(`Could not reach the Kitbase API: ${err instanceof Error ? err.message : String(err)}`);
		}
	};
}

export function makeCallApi(getToken: GetToken): CallApi {
	const withClient = makeWithClient(getToken);
	return (extra, fn) =>
		withClient(extra, async (client) => {
			const result = await fn(client);
			if (result.error !== undefined || !result.response.ok) {
				return errorResult(formatApiError(result));
			}
			return jsonResult(result.data);
		});
}

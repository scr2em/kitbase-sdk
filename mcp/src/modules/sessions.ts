import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import { errorResult, jsonResult } from "../lib/render.js";
import * as p from "../lib/params.js";

export function registerSessionsTools(server: McpServer, { callApi, withClient }: ToolContext): void {
	server.registerTool(
		"list_sessions",
		{
			title: "List sessions",
			description: "Read-only. Aggregated visitor sessions for a project, paginated, with search and dimension filters.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				search: z.string().optional().describe("Search by user ID or session ID (partial match)."),
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: p.timezone,
				filters: p.filters,
				page: p.page,
				size: p.size,
			},
		},
		async (args, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/sessions", {
					params: {
						path: { orgSlug: args.orgSlug, projectId: args.projectId },
						query: {
							search: args.search,
							preset: args.preset,
							from: args.from,
							to: args.to,
							timezone: args.timezone,
							filters: args.filters,
							page: args.page,
							size: args.size,
						},
					},
				}),
			),
	);

	server.registerTool(
		"get_session",
		{
			title: "Get session detail",
			description:
				"Read-only. One session's aggregated detail. Set `includeEvents: true` to also return the session's " +
				"event stream (first page).",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				sessionId: z.string().describe("Session identifier (from list_sessions)."),
				includeEvents: z.boolean().optional().describe("Also fetch this session's events."),
				page: p.page,
				size: p.size,
			},
		},
		async ({ orgSlug, projectId, sessionId, includeEvents, page, size }, extra) =>
			withClient(extra, async (client) => {
				const detail = await client.GET("/{orgSlug}/projects/{projectId}/sessions/{sessionId}", {
					params: { path: { orgSlug, projectId, sessionId } },
				});
				if (detail.error !== undefined || !detail.response.ok) {
					return errorResult(`Failed to get session "${sessionId}" (HTTP ${detail.response.status}).`);
				}
				if (!includeEvents) return jsonResult(detail.data);

				const events = await client.GET("/{orgSlug}/projects/{projectId}/sessions/{sessionId}/events", {
					params: { path: { orgSlug, projectId, sessionId }, query: { page, size } },
				});
				return jsonResult({
					session: detail.data,
					events: events.response.ok ? events.data : { error: `HTTP ${events.response.status}` },
				});
			}),
	);
}

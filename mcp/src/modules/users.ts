import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import { errorResult, jsonResult } from "../lib/render.js";
import * as p from "../lib/params.js";

export function registerUsersTools(server: McpServer, { callApi, withClient }: ToolContext): void {
	server.registerTool(
		"list_analytics_users",
		{
			title: "List analytics users",
			description: "Read-only. Aggregated analytics users for a project, paginated, with search and dimension filters.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				type: z.enum(["all", "identified", "anonymous"]).optional().describe("Filter by identification status. Defaults to all."),
				search: z.string().optional().describe("Search by user_id or anonymous_id (partial match)."),
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
				c.GET("/{orgSlug}/projects/{projectId}/analytics/users", {
					params: {
						path: { orgSlug: args.orgSlug, projectId: args.projectId },
						query: {
							type: args.type,
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
		"get_analytics_user",
		{
			title: "Get analytics user",
			description:
				"Read-only. A single analytics user's data. Choose which parts via `include`: summary (default), " +
				"activity heatmap, and/or recent events.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				userId: z.string().describe("Resolved user ID (from list_analytics_users)."),
				include: z
					.array(z.enum(["summary", "activity", "events"]))
					.optional()
					.describe("Which sections to fetch. Defaults to ['summary']."),
				months: z.number().int().min(1).max(24).default(4).describe("Months of activity for the heatmap (include=activity)."),
				page: p.page,
				size: p.size,
			},
		},
		async ({ orgSlug, projectId, userId, include, months, page, size }, extra) =>
			withClient(extra, async (client) => {
				const sections = include && include.length > 0 ? include : ["summary"];
				const path = { orgSlug, projectId, userId };
				const out: Record<string, unknown> = {};

				if (sections.includes("summary")) {
					const r = await client.GET("/{orgSlug}/projects/{projectId}/analytics/users/{userId}/summary", {
						params: { path },
					});
					if (r.error !== undefined || !r.response.ok) {
						return errorResult(`Failed to get user "${userId}" summary (HTTP ${r.response.status}).`);
					}
					out.summary = r.data;
				}
				if (sections.includes("activity")) {
					const r = await client.GET("/{orgSlug}/projects/{projectId}/analytics/users/{userId}/activity", {
						params: { path, query: { months } },
					});
					out.activity = r.response.ok ? r.data : { error: `HTTP ${r.response.status}` };
				}
				if (sections.includes("events")) {
					const r = await client.GET("/{orgSlug}/projects/{projectId}/analytics/users/{userId}/events", {
						params: { path, query: { page, size } },
					});
					out.events = r.response.ok ? r.data : { error: `HTTP ${r.response.status}` };
				}
				return jsonResult(out);
			}),
	);
}

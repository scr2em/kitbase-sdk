import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import * as p from "../lib/params.js";

export function registerBotsTools(server: McpServer, { callApi }: ToolContext): void {
	server.registerTool(
		"bots_analytics",
		{
			title: "Bot / AI-crawler analytics",
			description:
				"Read-only. Bot and AI-crawler traffic. Pick a `view`: top bots, top scraped paths, a per-vendor " +
				"timeline, or a per-country breakdown.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				view: z.enum(["top_bots", "top_paths", "timeline", "countries"]).describe("Which bot analytics view to return."),
				interval: z.enum(["minute", "hour", "day"]).optional().describe("Timeline granularity (view=timeline). Defaults to day."),
				size: z.number().int().min(1).max(100).default(10).describe("Max rows (top_bots/top_paths/countries)."),
				page: p.page,
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: p.timezone,
			},
		},
		async ({ orgSlug, projectId, view, interval, size, page, preset, from, to, timezone }, extra) => {
			const path = { orgSlug, projectId };
			switch (view) {
				case "top_bots":
					return callApi(extra, (c) =>
						c.GET("/{orgSlug}/projects/{projectId}/bots/analytics/top", {
							params: { path, query: { preset, from, to, timezone, size } },
						}),
					);
				case "top_paths":
					return callApi(extra, (c) =>
						c.GET("/{orgSlug}/projects/{projectId}/bots/analytics/top-paths", {
							params: { path, query: { preset, from, to, timezone, size } },
						}),
					);
				case "countries":
					return callApi(extra, (c) =>
						c.GET("/{orgSlug}/projects/{projectId}/bots/analytics/countries", {
							params: { path, query: { preset, from, to, timezone, page, size } },
						}),
					);
				case "timeline":
					return callApi(extra, (c) =>
						c.GET("/{orgSlug}/projects/{projectId}/bots/analytics/timeline", {
							params: { path, query: { preset, from, to, timezone, interval } },
						}),
					);
			}
		},
	);

	server.registerTool(
		"list_bot_requests",
		{
			title: "List bot/crawler requests",
			description: "Read-only. Raw bot/crawler request log for a project, paginated, with search and actor-type filter.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				search: z.string().optional().describe("Search by bot name, vendor, or path (partial match)."),
				actorType: z.string().optional().describe("Filter by actor type: verified_bot, spoofed_bot, or suspected_bot."),
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: p.timezone,
				page: p.page,
				size: p.size,
			},
		},
		async (args, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/bots", {
					params: {
						path: { orgSlug: args.orgSlug, projectId: args.projectId },
						query: {
							search: args.search,
							actorType: args.actorType,
							preset: args.preset,
							from: args.from,
							to: args.to,
							timezone: args.timezone,
							page: args.page,
							size: args.size,
						},
					},
				}),
			),
	);
}

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import * as p from "../lib/params.js";

const EVENT_BREAKDOWN_DIMENSIONS = [
	"event_name",
	"user",
	"country",
	"region",
	"city",
	"browser",
	"browser_version",
	"os",
	"os_version",
	"device",
	"brand",
	"model",
	"utm_source",
	"utm_medium",
	"utm_campaign",
] as const;

const sort = z.enum(["asc", "desc"]).optional().describe("Sort order by timestamp. Defaults to desc.");

export function registerEventsTools(server: McpServer, { callApi }: ToolContext): void {
	server.registerTool(
		"events_stats",
		{
			title: "Custom event stats",
			description:
				"Read-only. Aggregated custom-event statistics: total events, unique users, and a breakdown " +
				"grouped by event name or user.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				group_by: z.enum(["event", "user"]).optional().describe("Group stats by event name or user. Defaults to event."),
				channel: z.string().optional().describe("Filter by channel."),
				from: p.from,
				to: p.to,
				timezone: p.timezone,
			},
		},
		async ({ orgSlug, projectId, group_by, channel, from, to, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/events/analytics/stats", {
					params: { path: { orgSlug, projectId }, query: { group_by, channel, from, to, timezone } },
				}),
			),
	);

	server.registerTool(
		"events_timeline",
		{
			title: "Custom event timeline",
			description: "Read-only. Custom-event counts over time at a configurable interval, optionally for one event name.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				interval: z.enum(["hour", "day", "week", "month"]).optional().describe("Time interval. Defaults to day."),
				event: z.string().optional().describe("Filter by a specific event name."),
				from: p.from,
				to: p.to,
				timezone: p.timezone,
			},
		},
		async ({ orgSlug, projectId, interval, event, from, to, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/events/analytics/timeline", {
					params: { path: { orgSlug, projectId }, query: { interval, event, from, to, timezone } },
				}),
			),
	);

	server.registerTool(
		"events_breakdown",
		{
			title: "Custom event breakdown",
			description: "Read-only. Custom events grouped by a dimension (event name, user, geo, browser, OS, device, UTM).",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				dimension: z.enum(EVENT_BREAKDOWN_DIMENSIONS).describe("Dimension to group events by."),
				limit: z.number().int().min(1).max(100).default(20).describe("Max results (1-100)."),
				from: p.from,
				to: p.to,
				timezone: p.timezone,
			},
		},
		async ({ orgSlug, projectId, dimension, limit, from, to, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/events/analytics/breakdown", {
					params: { path: { orgSlug, projectId }, query: { dimension, limit, from, to, timezone } },
				}),
			),
	);

	server.registerTool(
		"events_aggregations",
		{
			title: "Aggregated unique events",
			description:
				"Read-only. One aggregated row per unique event name: total count, unique users, first/last seen, " +
				"and a 24-hour hourly sparkline. Paginated and searchable.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				channel: z.string().optional().describe("Filter by channel."),
				search: z.string().optional().describe("Case-insensitive substring filter on event name."),
				user_id: z.string().optional().describe("Scope aggregations to events from matching users (substring)."),
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: p.timezone,
				page: p.page,
				size: p.size,
				sort: z.enum(["asc", "desc"]).optional().describe("Sort by event count. Defaults to desc."),
			},
		},
		async (args, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/events/analytics/aggregations", {
					params: {
						path: { orgSlug: args.orgSlug, projectId: args.projectId },
						query: {
							channel: args.channel,
							search: args.search,
							user_id: args.user_id,
							preset: args.preset,
							from: args.from,
							to: args.to,
							timezone: args.timezone,
							page: args.page,
							size: args.size,
							sort: args.sort,
						},
					},
				}),
			),
	);

	server.registerTool(
		"list_events",
		{
			title: "List custom events",
			description: "Read-only. Raw custom events for a project, paginated, with name/channel/user/date filters.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				event: z.string().optional().describe("Filter by event name."),
				channel: z.string().optional().describe("Filter by channel."),
				user_id: z.string().optional().describe("Filter by user ID."),
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: p.timezone,
				filters: p.filters,
				page: p.page,
				size: p.size,
				sort,
			},
		},
		async (args, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/events", {
					params: {
						path: { orgSlug: args.orgSlug, projectId: args.projectId },
						query: {
							event: args.event,
							channel: args.channel,
							user_id: args.user_id,
							preset: args.preset,
							from: args.from,
							to: args.to,
							timezone: args.timezone,
							filters: args.filters,
							page: args.page,
							size: args.size,
							sort: args.sort,
						},
					},
				}),
			),
	);
}

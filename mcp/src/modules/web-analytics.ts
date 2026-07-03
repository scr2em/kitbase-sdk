import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import { errorResult } from "../lib/render.js";
import * as p from "../lib/params.js";

const dimension = z.enum(p.BREAKDOWN_DIMENSIONS);

export function registerWebAnalyticsTools(server: McpServer, { callApi }: ToolContext): void {
	server.registerTool(
		"web_analytics_summary",
		{
			title: "Web analytics summary",
			description:
				"Read-only. Project web analytics summary: unique visitors, sessions, pageviews, bounce rate, " +
				"average session duration and revenue for the period, each with its change vs the previous period.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				preset: p.preset,
				from: p.from,
				to: p.to,
				filters: p.filters,
				timezone: p.timezone,
			},
		},
		async ({ orgSlug, projectId, preset, from, to, filters, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/web-analytics", {
					params: { path: { orgSlug, projectId }, query: { preset, from, to, filters, timezone } },
				}),
			),
	);

	server.registerTool(
		"web_analytics_timeline",
		{
			title: "Web analytics timeline",
			description:
				"Read-only. Time-bucketed pageviews, sessions and unique visitors (current vs previous period). " +
				"Set both `dimension` and `value` to drill into one dimension value's timeline (e.g. Chrome, US).",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				interval: z
					.enum(["minute", "hour", "day"])
					.optional()
					.describe("Time-bucketing granularity. Defaults to hour."),
				dimension: dimension.optional().describe("Drill-in dimension. Requires `value`."),
				value: z.string().optional().describe("Drill-in dimension value (e.g. 'Chrome'). Requires `dimension`."),
				preset: p.preset,
				from: p.from,
				to: p.to,
				filters: p.filters,
				timezone: p.timezone,
			},
		},
		async ({ orgSlug, projectId, interval, dimension, value, preset, from, to, filters, timezone }, extra) => {
			if ((dimension && !value) || (!dimension && value)) {
				return errorResult("`dimension` and `value` must be provided together for a drill-in timeline.");
			}
			if (dimension && value) {
				return callApi(extra, (c) =>
					c.GET("/{orgSlug}/projects/{projectId}/web-analytics/dimension/timeline", {
						params: {
							path: { orgSlug, projectId },
							query: { dimension, value, preset, from, to, filters, timezone },
						},
					}),
				);
			}
			return callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/web-analytics/timeline", {
					params: { path: { orgSlug, projectId }, query: { interval, preset, from, to, filters, timezone } },
				}),
			);
		},
	);

	server.registerTool(
		"web_analytics_breakdown",
		{
			title: "Web analytics breakdown",
			description:
				"Read-only. Top values for a dimension (country, browser, path, referrer, utm_*, device, etc.), " +
				"paginated. Use dimension `page_duration` for the top pages ranked by average time spent.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				dimension: z
					.enum([...p.BREAKDOWN_DIMENSIONS, "page_duration"])
					.describe("Dimension to break down by, or 'page_duration' for top pages by avg time spent."),
				page: p.page,
				size: p.size,
				preset: p.preset,
				from: p.from,
				to: p.to,
				filters: p.filters,
				timezone: p.timezone,
			},
		},
		async ({ orgSlug, projectId, dimension, page, size, preset, from, to, filters, timezone }, extra) => {
			if (dimension === "page_duration") {
				return callApi(extra, (c) =>
					c.GET("/{orgSlug}/projects/{projectId}/web-analytics/pages/duration", {
						params: { path: { orgSlug, projectId }, query: { preset, from, to, filters, timezone } },
					}),
				);
			}
			return callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/web-analytics/breakdown", {
					params: {
						path: { orgSlug, projectId },
						query: { dimension, page, size, preset, from, to, filters, timezone },
					},
				}),
			);
		},
	);

	server.registerTool(
		"web_analytics_compare",
		{
			title: "Compare web analytics periods",
			description:
				"Read-only. Compare one breakdown dimension across two explicit date ranges; returns per-value " +
				"counts for both periods with absolute and percentage change, biggest movers first.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				dimension,
				currentFrom: z.string().describe("Current period start (inclusive, YYYY-MM-DD)."),
				currentTo: z.string().describe("Current period end (inclusive, YYYY-MM-DD)."),
				previousFrom: z.string().describe("Previous period start (inclusive, YYYY-MM-DD)."),
				previousTo: z.string().describe("Previous period end (inclusive, YYYY-MM-DD)."),
				limit: z.number().int().min(1).max(100).default(10).describe("Max results (1-100)."),
				filters: p.filters,
				timezone: p.timezone,
			},
		},
		async (args, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/web-analytics/compare", {
					params: {
						path: { orgSlug: args.orgSlug, projectId: args.projectId },
						query: {
							dimension: args.dimension,
							currentFrom: args.currentFrom,
							currentTo: args.currentTo,
							previousFrom: args.previousFrom,
							previousTo: args.previousTo,
							limit: args.limit,
							filters: args.filters,
							timezone: args.timezone,
						},
					},
				}),
			),
	);

	server.registerTool(
		"list_tracked_names",
		{
			title: "List tracked paths or event names",
			description:
				"Read-only. List the distinct page paths or custom event names seen in a project. Useful for " +
				"building `filters` or picking an event name for the events tools.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				kind: z.enum(["paths", "event_names"]).describe("Which set of names to return."),
			},
		},
		async ({ orgSlug, projectId, kind }, extra) =>
			callApi(extra, (c) =>
				kind === "paths"
					? c.GET("/{orgSlug}/projects/{projectId}/web-analytics/paths", {
							params: { path: { orgSlug, projectId } },
						})
					: c.GET("/{orgSlug}/projects/{projectId}/events/names", {
							params: { path: { orgSlug, projectId } },
						}),
			),
	);
}

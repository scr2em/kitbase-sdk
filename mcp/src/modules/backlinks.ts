import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import * as p from "../lib/params.js";

const days = z
	.number()
	.int()
	.min(1)
	.max(365)
	.optional()
	.describe("Window in days for the referred-visit counts.");

export function registerBacklinksTools(server: McpServer, { callApi }: ToolContext): void {
	server.registerTool(
		"list_backlinks",
		{
			title: "List backlinks",
			description:
				"Read-only. Referring domains (backlinks) detected from the project's real traffic — search engines, " +
				"social networks, AI assistants and self-referrals are excluded. Includes referred-visit counts for the window.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				status: z
					.enum(["active", "ignored", "all"])
					.optional()
					.describe("Status filter. Defaults to active."),
				sort: z
					.enum(["first_seen", "sessions"])
					.optional()
					.describe("Sort by discovery recency (first_seen, default) or referred visits."),
				q: z.string().optional().describe("Case-insensitive substring match on the domain."),
				days,
				page: p.page,
				size: p.size,
			},
		},
		async ({ orgSlug, projectId, status, sort, q, days: d, page, size }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/backlinks", {
					params: { path: { orgSlug, projectId }, query: { status, sort, q, days: d, page, size } },
				}),
			),
	);

	server.registerTool(
		"backlink_detail",
		{
			title: "Backlink detail",
			description:
				"Read-only. Drill into one referring domain: daily referred-visit timeline, landing pages, and the " +
				"distinct linking-page URLs it sends visitors from.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				domain: z
					.string()
					.describe("Normalized referring host as returned by list_backlinks, e.g. news.ycombinator.com."),
				days,
			},
		},
		async ({ orgSlug, projectId, domain, days: d }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/backlinks/detail", {
					params: { path: { orgSlug, projectId }, query: { domain, days: d } },
				}),
			),
	);

	server.registerTool(
		"backlink_reclamation",
		{
			title: "Backlink reclamation",
			description:
				"Read-only. Dead pages (recorded broken by the site crawler) that still receive external referral " +
				"traffic — existing backlinks recoverable with a redirect. siteIndexAvailable is false when the site " +
				"has never been indexed.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				days,
			},
		},
		async ({ orgSlug, projectId, days: d }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/backlinks/reclamation", {
					params: { path: { orgSlug, projectId }, query: { days: d } },
				}),
			),
	);

	server.registerTool(
		"backlink_opportunities",
		{
			title: "Backlink opportunities",
			description:
				"Read-only. Third-party domains AI answers cite for the project's prompts where the brand is absent — " +
				"a ranked set of sites worth earning a link from. Requires AI Visibility to be configured.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				jobs: z
					.number()
					.int()
					.min(1)
					.optional()
					.describe("How many most-recent AI-visibility scan jobs to aggregate. Defaults to 10."),
				limit: z.number().int().min(1).max(100).optional().describe("Maximum number of domains to return."),
			},
		},
		async ({ orgSlug, projectId, jobs, limit }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/backlinks/opportunities", {
					params: { path: { orgSlug, projectId }, query: { jobs, limit } },
				}),
			),
	);
}

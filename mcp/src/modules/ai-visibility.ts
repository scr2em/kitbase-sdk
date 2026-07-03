import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import * as p from "../lib/params.js";

const aiTimezone = z
	.string()
	.optional()
	.describe("IANA timezone used to resolve preset/date boundaries. Defaults to UTC.");

const jobs = z
	.number()
	.int()
	.min(1)
	.optional()
	.describe("Number of most recent completed analysis jobs to aggregate (ignored when from/to are set).");

const limit = z.number().int().min(1).max(100).optional().describe("Maximum number of rows to return.");

export function registerAiVisibilityTools(server: McpServer, { callApi }: ToolContext): void {
	server.registerTool(
		"ai_visibility_series",
		{
			title: "AI visibility over time",
			description:
				"Read-only. Presence-rate time series — how often the project's brand appears in AI answers, " +
				"one point per completed analysis job (oldest first).",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				provider: p.aiProvider,
				limit,
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: aiTimezone,
			},
		},
		async ({ orgSlug, projectId, provider, limit, preset, from, to, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/visibility", {
					params: { path: { orgSlug, projectId }, query: { provider, limit, preset, from, to, timezone } },
				}),
			),
	);

	server.registerTool(
		"ai_visibility_share_of_voice",
		{
			title: "AI share of voice",
			description:
				"Read-only. Each tracked brand's normalized share of voice and rank per completed job, for one AI provider.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				provider: p.aiProvider,
				jobs,
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: aiTimezone,
			},
		},
		async ({ orgSlug, projectId, provider, jobs, preset, from, to, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/share-of-voice", {
					params: { path: { orgSlug, projectId }, query: { provider, jobs, preset, from, to, timezone } },
				}),
			),
	);

	server.registerTool(
		"ai_visibility_breakdown",
		{
			title: "AI visibility per provider",
			description: "Read-only. Presence and citation totals per AI provider, aggregated over recent completed jobs.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				jobs,
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: aiTimezone,
			},
		},
		async ({ orgSlug, projectId, jobs, preset, from, to, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/breakdown", {
					params: { path: { orgSlug, projectId }, query: { jobs, preset, from, to, timezone } },
				}),
			),
	);

	server.registerTool(
		"ai_visibility_competitors",
		{
			title: "AI visibility competitors",
			description:
				"Read-only. Every tracked brand (own brand + competitors) ranked by visibility rate in AI answers.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				provider: p.aiProvider,
				jobs,
				limit,
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: aiTimezone,
			},
		},
		async ({ orgSlug, projectId, provider, jobs, limit, preset, from, to, timezone }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/competitors", {
					params: { path: { orgSlug, projectId }, query: { provider, jobs, limit, preset, from, to, timezone } },
				}),
			),
	);

	server.registerTool(
		"ai_visibility_citations",
		{
			title: "AI visibility citations",
			description:
				"Read-only. Domains cited by AI answers (classified self / competitor / other). Pass `domain` to " +
				"drill into that domain's individual cited URLs.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				domain: z.string().optional().describe("Registrable domain (e.g. 'reddit.com') to list its cited URLs."),
				provider: p.aiProvider,
				jobs,
				limit,
				page: p.page,
				size: p.size,
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: aiTimezone,
			},
		},
		async ({ orgSlug, projectId, domain, provider, jobs, limit, page, size, preset, from, to, timezone }, extra) => {
			if (domain) {
				return callApi(extra, (c) =>
					c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/domains/{domain}/citations", {
						params: {
							path: { orgSlug, projectId, domain },
							query: { provider, jobs, page, size, preset, from, to, timezone },
						},
					}),
				);
			}
			return callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/domains", {
					params: { path: { orgSlug, projectId }, query: { provider, jobs, limit, preset, from, to, timezone } },
				}),
			);
		},
	);

	server.registerTool(
		"ai_visibility_prompts",
		{
			title: "AI visibility prompts",
			description:
				"Read-only. List the project's tracked prompts. Set `includeBreakdown: true` for each prompt's " +
				"presence metrics aggregated over recent completed jobs.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				includeBreakdown: z.boolean().optional().describe("Return per-prompt performance metrics instead of the plain list."),
				jobs,
				preset: p.preset,
				from: p.from,
				to: p.to,
				timezone: aiTimezone,
			},
		},
		async ({ orgSlug, projectId, includeBreakdown, jobs, preset, from, to, timezone }, extra) => {
			if (includeBreakdown) {
				return callApi(extra, (c) =>
					c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/prompts-breakdown", {
						params: { path: { orgSlug, projectId }, query: { jobs, preset, from, to, timezone } },
					}),
				);
			}
			return callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/prompts", {
					params: { path: { orgSlug, projectId } },
				}),
			);
		},
	);

	server.registerTool(
		"ai_visibility_jobs",
		{
			title: "AI visibility jobs",
			description:
				"Read-only. Analysis job history (newest first). Pass `jobId` for one job's detail and live progress.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				jobId: z.string().optional().describe("If set, return this job's detail instead of the list."),
				limit,
			},
		},
		async ({ orgSlug, projectId, jobId, limit }, extra) => {
			if (jobId) {
				return callApi(extra, (c) =>
					c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/jobs/{jobId}", {
						params: { path: { orgSlug, projectId, jobId } },
					}),
				);
			}
			return callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/ai-visibility/jobs", {
					params: { path: { orgSlug, projectId }, query: { limit } },
				}),
			);
		},
	);
}

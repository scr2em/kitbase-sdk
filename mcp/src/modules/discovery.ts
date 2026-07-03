import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import { errorResult, jsonResult } from "../lib/render.js";

// Discovery: resolve the orgSlug + projectId that every other tool needs.
export function registerDiscoveryTools(server: McpServer, { withClient }: ToolContext): void {
	server.registerTool(
		"list_orgs_and_projects",
		{
			title: "List organizations and projects",
			description:
				"Read-only. List the organizations the signed-in user belongs to and each org's projects. " +
				"Call this FIRST to discover the `orgSlug` and `projectId` values that every other Kitbase " +
				"tool requires. Pass `orgSlug` to list just that org's projects.",
			inputSchema: {
				orgSlug: z
					.string()
					.optional()
					.describe("If set, only this organization's projects are returned. Otherwise, all orgs are listed."),
			},
		},
		async ({ orgSlug }, extra) =>
			withClient(extra, async (client) => {
				if (orgSlug) {
					const projects = await client.GET("/{orgSlug}/projects", {
						params: { path: { orgSlug } },
					});
					if (projects.error !== undefined || !projects.response.ok) {
						return errorResult(`Failed to list projects for "${orgSlug}" (HTTP ${projects.response.status}).`);
					}
					return jsonResult({ orgSlug, projects: (projects.data ?? []).map(compactProject) });
				}

				const orgs = await client.GET("/organizations", {});
				if (orgs.error !== undefined || !orgs.response.ok) {
					return errorResult(`Failed to list organizations (HTTP ${orgs.response.status}).`);
				}

				const organizations = await Promise.all(
					(orgs.data ?? []).map(async (org) => {
						const projects = await client.GET("/{orgSlug}/projects", {
							params: { path: { orgSlug: org.orgSlug } },
						});
						return {
							orgSlug: org.orgSlug,
							name: org.name,
							id: org.id,
							projects: projects.response.ok ? (projects.data ?? []).map(compactProject) : [],
						};
					}),
				);
				return jsonResult({ organizations });
			}),
	);
}

function compactProject(project: { id: string; name: string; projectType?: unknown }): {
	projectId: string;
	name: string;
	projectType?: unknown;
} {
	return { projectId: project.id, name: project.name, projectType: project.projectType };
}

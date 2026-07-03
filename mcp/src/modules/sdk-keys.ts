import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./helpers.js";
import * as p from "../lib/params.js";

export function registerSdkKeysTools(server: McpServer, { callApi }: ToolContext): void {
	server.registerTool(
		"list_sdk_keys",
		{
			title: "List SDK keys",
			description:
				"Read-only. List a project's public SDK keys (used by client apps to send analytics). Private API " +
				"keys and secret values are never returned.",
			inputSchema: {
				orgSlug: p.orgSlug,
				projectId: p.projectId,
				page: p.page,
				size: p.size,
				sort: z.enum(["asc", "desc"]).optional().describe("Sort by createdAt. Defaults to desc."),
			},
		},
		async ({ orgSlug, projectId, page, size, sort }, extra) =>
			callApi(extra, (c) =>
				c.GET("/{orgSlug}/projects/{projectId}/sdk-keys", {
					params: { path: { orgSlug, projectId }, query: { page, size, sort } },
				}),
			),
	);
}

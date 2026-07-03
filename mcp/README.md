# @kitbase/mcp

MCP server for Kitbase. Exposes project-level, **read-only** analytics tools to
Claude (and any MCP client): web/event analytics, AI visibility (including
citations), bot/crawler analytics, sessions, analytics users, and SDK-key
listing.

Runs locally over stdio (Claude Desktop / Claude Code / the MCP Inspector),
authenticating from a `kitbase login` session or an env token.

All tools are generated-type-safe against the Kitbase OpenAPI spec (the same
`openapi-typescript` + `openapi-fetch` pipeline the CLI uses) and return compact
JSON so Claude can reason over the numbers directly.

## Local use (stdio)

```bash
# Log in once with the CLI, then point any MCP client at the stdio binary:
kitbase login
claude mcp add kitbase -- npx -y @kitbase/mcp
```

Token resolution order (first match wins):

1. `KITBASE_TOKEN` — an explicit user JWT.
2. `KITBASE_API_KEY` — a private API key (`sk_kitbase_*`), sent as-is.
3. The CLI credentials file (`~/.config/kitbase/credentials.json`), refreshed
   automatically when near expiry.

`KITBASE_API_URL` overrides the backend (default `https://api.kitbase.dev`).

## Tools

Call `list_orgs_and_projects` first to discover the `orgSlug` / `projectId`
every other tool needs. Then, for example:

| Area | Tools |
| --- | --- |
| Web analytics | `web_analytics_summary`, `web_analytics_timeline`, `web_analytics_breakdown`, `web_analytics_compare`, `list_tracked_names` |
| Events | `events_stats`, `events_timeline`, `events_breakdown`, `events_aggregations`, `list_events` |
| AI visibility | `ai_visibility_series`, `ai_visibility_share_of_voice`, `ai_visibility_breakdown`, `ai_visibility_competitors`, `ai_visibility_citations`, `ai_visibility_prompts`, `ai_visibility_jobs` |
| Bots / crawlers | `bots_analytics`, `list_bot_requests` |
| Sessions | `list_sessions`, `get_session` |
| Users | `list_analytics_users`, `get_analytics_user` |
| SDK keys | `list_sdk_keys` |

All read-only. Date-scoped tools accept a `preset` (`last_7_days`, `this_month`,
…) or explicit `from`/`to` (`YYYY-MM-DD`) plus a `timezone`.

## Development

```bash
pnpm --filter @kitbase/mcp generate      # regenerate src/generated/api.ts from the spec
pnpm --filter @kitbase/mcp typecheck
pnpm --filter @kitbase/mcp build
```

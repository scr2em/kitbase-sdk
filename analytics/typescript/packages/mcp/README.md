# @kitbase/analytics-mcp

MCP (Model Context Protocol) server that lets AI agents query Kitbase analytics data. Connect it to Claude Code, Cursor, or any MCP-compatible client to give your AI assistant access to your analytics.

## Installation

```bash
npm install @kitbase/analytics-mcp
```

Or run directly with npx:

```bash
npx @kitbase/analytics-mcp
```

## Configuration

The server is configured via environment variables:

| Variable | Required | Description |
|---|---|---|
| `KITBASE_API_KEY` | Yes | Private API key (must start with `sk_kitbase_`) |
| `KITBASE_API_URL` | No | Kitbase API base URL (default: `https://api.kitbase.dev`) |

The project and environment are automatically resolved from the API key — no need to specify them manually.

## MCP Client Configuration

### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "kitbase-analytics": {
      "command": "npx",
      "args": ["@kitbase/analytics-mcp"],
      "env": {
        "KITBASE_API_KEY": "sk_kitbase_your_key_here"
      }
    }
  }
}
```

### Cursor / Other MCP Clients

Use the same configuration format. The server communicates over stdio using the standard MCP protocol.

## Available Tools

### Web Analytics

| Tool | Description |
|---|---|
| `get_web_summary` | Get summary KPIs (visitors, pageviews, bounce rate, etc.) with percentage changes vs previous period |
| `get_web_timeline` | Get metrics over time (timeseries data for charting trends) |
| `get_web_breakdown` | Break down metrics by dimension (pages, countries, browsers, referrers, etc.) |

### Events

| Tool | Description |
|---|---|
| `list_events` | List tracked events with optional filtering by name, user, or date range |
| `get_event_stats` | Get aggregated event statistics with timeline and optional property breakdown |

### Users

| Tool | Description |
|---|---|
| `list_users` | List or search users in the project |
| `get_user_summary` | Get a full user profile including summary, recent activity, and events |

### Sessions

| Tool | Description |
|---|---|
| `list_sessions` | List sessions with optional filtering |
| `get_session_detail` | Get detailed session info including all events in the session |

### Funnels

| Tool | Description |
|---|---|
| `analyze_funnel` | Analyze conversion funnel with ordered steps and get conversion rates between each step |

### Journeys

| Tool | Description |
|---|---|
| `analyze_journeys` | Analyze user navigation paths showing common routes through pages or events |

## Common Parameters

### Date Filtering

Most tools accept date filtering via either a preset or explicit date range:

- **`preset`**: One of `today`, `yesterday`, `last_7_days`, `last_30_days`, `last_3_months`, `last_12_months`
- **`from`** / **`to`**: Explicit date range in `YYYY-MM-DD` format
- **`timezone`**: Timezone for date calculations (default: `UTC`)

### Pagination

List endpoints support pagination:

- **`page`**: Page number (0-indexed)
- **`size`**: Number of items per page

### Filters

Web analytics tools support filters in the format `dimension:operator:values`:

```
"country:is:US"
"browser:is:Chrome"
"page:contains:/blog"
```

## Example Usage

Once connected, you can ask your AI assistant questions like:

- "How many visitors did we get last week?"
- "What are our top pages by pageviews this month?"
- "Show me the signup funnel conversion rate"
- "What countries are our users coming from?"
- "Find sessions for user john@example.com"
- "What's the most common user journey from the homepage?"

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Watch mode
pnpm dev
```

## License

MIT

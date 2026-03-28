# @kitbase/analytics-mcp

MCP (Model Context Protocol) server that lets AI agents query Kitbase analytics data. Connect it to Claude Code, Cursor, or any MCP-compatible client.

**[Full Documentation](https://docs.kitbase.dev/sdks/mcp)**

## Installation

```bash
npm install @kitbase/analytics-mcp
```

Or run directly:

```bash
npx -y @kitbase/analytics-mcp
```

## Quick Start (Claude Code)

```bash
claude mcp add kitbase-analytics -e "KITBASE_API_KEY=sk_kitbase_your_key_here" -- npx -y @kitbase/analytics-mcp
```

## License

MIT

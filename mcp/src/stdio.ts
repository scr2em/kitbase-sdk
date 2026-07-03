// STDIO entry point — for local use (Claude Desktop / Claude Code / MCP
// Inspector). No OAuth, no HTTP: just the tools, authenticated from a local
// `kitbase login` session or KITBASE_TOKEN / KITBASE_API_KEY.
//
// CRITICAL: stdout carries the JSON-RPC stream. Never write to stdout from
// here or any callee — logs must go to stderr.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./modules/index.js";
import { resolveLocalToken } from "./api/local-token.js";

// Ignore the request `extra` — the local token comes from env or the CLI
// credentials file. Errors surface on the first tool call, not at startup.
const server = buildServer(() => resolveLocalToken());
const transport = new StdioServerTransport();
await server.connect(transport);

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadEnv, resolveConfig } from './config.js';
import { KitbaseApiClient } from './client.js';
import { registerAllTools } from './tools/index.js';

async function main() {
  const env = loadEnv();
  const config = await resolveConfig(env);
  const client = new KitbaseApiClient(config);

  const server = new McpServer({
    name: 'kitbase-analytics',
    version: '0.1.0',
  });

  registerAllTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

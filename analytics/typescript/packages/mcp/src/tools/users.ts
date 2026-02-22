import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KitbaseApiClient } from '../client.js';
import { formatToolError } from '../errors.js';

export function registerUsersTools(server: McpServer, client: KitbaseApiClient): void {
  // list_users
  server.tool(
    'list_users',
    'List or search users in the project',
    {
      search: z.string().optional().describe('Search query (matches name, email, or user ID)'),
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset for filtering by activity'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      page: z.number().optional().describe('Page number (0-indexed)'),
      size: z.number().optional().describe('Page size'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/analytics/users', {
          params: {
            search: params.search,
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
            page: params.page,
            size: params.size,
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}

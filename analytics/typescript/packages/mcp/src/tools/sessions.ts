import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KitbaseApiClient } from '../client.js';
import { formatToolError } from '../errors.js';

export function registerSessionsTools(server: McpServer, client: KitbaseApiClient): void {
  // list_sessions
  server.tool(
    'list_sessions',
    'List sessions with optional filtering',
    {
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      page: z.number().optional().describe('Page number (0-indexed)'),
      size: z.number().optional().describe('Page size'),
      sort: z.enum(['asc', 'desc']).optional().describe('Sort order'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/sessions', {
          params: {
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
            page: params.page,
            size: params.size,
            sort: params.sort,
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  // get_session_detail
  server.tool(
    'get_session_detail',
    'Get detailed information about a specific session, including its events',
    {
      sessionId: z.string().describe('The session ID'),
    },
    async (params) => {
      try {
        const [session, events] = await Promise.all([
          client.request(`/projects/{projectId}/sessions/${params.sessionId}`),
          client.request(`/projects/{projectId}/sessions/${params.sessionId}/events`),
        ]);

        return { content: [{ type: 'text', text: JSON.stringify({ session, events }, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}

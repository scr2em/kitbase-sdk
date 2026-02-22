import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KitbaseApiClient } from '../client.js';
import { formatToolError } from '../errors.js';

export function registerJourneysTools(server: McpServer, client: KitbaseApiClient): void {
  server.tool(
    'analyze_journeys',
    'Analyze user navigation paths/journeys — shows common paths users take through pages or events',
    {
      startPage: z.string().optional().describe('Starting page path to analyze journeys from'),
      endPage: z.string().optional().describe('Ending page path to analyze journeys to'),
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      depth: z.number().optional().describe('Maximum path depth to analyze'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/journeys/analyze', {
          method: 'POST',
          body: {
            startPage: params.startPage,
            endPage: params.endPage,
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
            depth: params.depth,
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}

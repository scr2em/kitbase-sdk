import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KitbaseApiClient } from '../client.js';
import { formatToolError } from '../errors.js';

export function registerFrustrationTools(server: McpServer, client: KitbaseApiClient): void {
  // get_frustration_report
  server.tool(
    'get_frustration_report',
    'Get frustration signals report (rage clicks, dead clicks) with top frustrated pages and elements',
    {
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      limit: z.number().optional().describe('Max number of top pages/elements to return (default: 10)'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/frustration-signals', {
          params: {
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
            limit: params.limit,
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}

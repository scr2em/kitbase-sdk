import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KitbaseApiClient } from '../client.js';
import { formatToolError } from '../errors.js';

export function registerFunnelsTools(server: McpServer, client: KitbaseApiClient): void {
  server.tool(
    'analyze_funnel',
    'Analyze conversion funnel — provide ordered steps and get conversion rates between each step',
    {
      steps: z.array(
        z.object({
          eventName: z.string().describe('Event name for this funnel step'),
          filters: z.array(z.string()).optional().describe('Optional filters for this step in format "property:operator:value"'),
        }),
      ).min(2).describe('Ordered funnel steps (minimum 2)'),
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/funnels/analyze', {
          method: 'POST',
          body: {
            steps: params.steps,
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}

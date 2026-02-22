import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KitbaseApiClient } from '../client.js';
import { formatToolError } from '../errors.js';

export function registerEventsTools(server: McpServer, client: KitbaseApiClient): void {
  // list_events
  server.tool(
    'list_events',
    'List tracked events with optional filtering by event name, user, or date range',
    {
      eventName: z.string().optional().describe('Filter by event name'),
      userId: z.string().optional().describe('Filter by user ID'),
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
        const result = await client.request('/projects/{projectId}/events', {
          params: {
            eventName: params.eventName,
            userId: params.userId,
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

  // get_event_stats
  server.tool(
    'get_event_stats',
    'Get aggregated event statistics including total counts, timeline, and breakdown by properties',
    {
      eventName: z.string().optional().describe('Filter by event name'),
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      breakdownProperty: z.string().optional().describe('Property to break down by'),
    },
    async (params) => {
      try {
        const baseParams = {
          eventName: params.eventName,
          preset: params.preset,
          from: params.from,
          to: params.to,
          timezone: params.timezone ?? 'UTC',
        };

        // Fetch stats, timeline, and optionally breakdown in parallel
        const requests: Promise<unknown>[] = [
          client.request('/projects/{projectId}/events/analytics/stats', { params: baseParams }),
          client.request('/projects/{projectId}/events/analytics/timeline', { params: baseParams }),
        ];

        if (params.breakdownProperty) {
          requests.push(
            client.request('/projects/{projectId}/events/analytics/breakdown', {
              params: { ...baseParams, property: params.breakdownProperty },
            }),
          );
        }

        const [stats, timeline, breakdown] = await Promise.all(requests);

        const result: Record<string, unknown> = { stats, timeline };
        if (breakdown) result.breakdown = breakdown;

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}

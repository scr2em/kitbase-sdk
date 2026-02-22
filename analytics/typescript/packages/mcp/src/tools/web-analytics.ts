import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KitbaseApiClient } from '../client.js';
import { formatToolError } from '../errors.js';

export function registerWebAnalyticsTools(server: McpServer, client: KitbaseApiClient): void {
  // get_web_summary
  server.tool(
    'get_web_summary',
    'Get web analytics summary KPIs (visitors, pageviews, bounce rate, etc.) with percentage changes compared to previous period',
    {
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      filters: z.array(z.string()).optional().describe('Filters in format "dimension:operator:values" (e.g., "country:is:US")'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/web-analytics', {
          params: {
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
            ...filtersToParams(params.filters),
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  // get_web_timeline
  server.tool(
    'get_web_timeline',
    'Get web analytics metrics over time (timeseries data for charting trends)',
    {
      metric: z.string().describe('Metric to chart (e.g., "visitors", "pageviews", "bounce_rate", "visit_duration", "views_per_visit")'),
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      filters: z.array(z.string()).optional().describe('Filters in format "dimension:operator:values"'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/web-analytics/timeline', {
          params: {
            metric: params.metric,
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
            ...filtersToParams(params.filters),
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  // get_web_breakdown
  server.tool(
    'get_web_breakdown',
    'Get web analytics broken down by a dimension (e.g., top pages, countries, browsers, referrers)',
    {
      dimension: z.string().describe('Dimension to break down by (e.g., "page", "country", "browser", "os", "device", "referrer", "utm_source", "utm_medium", "utm_campaign")'),
      metric: z.string().optional().describe('Metric to sort by (default: "visitors")'),
      preset: z.enum(['last_30_minutes', 'last_hour', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'this_year']).optional().describe('Date preset'),
      from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().optional().describe('End date (YYYY-MM-DD)'),
      timezone: z.string().optional().describe('Timezone (default: UTC)'),
      filters: z.array(z.string()).optional().describe('Filters in format "dimension:operator:values"'),
      page: z.number().optional().describe('Page number (0-indexed)'),
      size: z.number().optional().describe('Page size'),
    },
    async (params) => {
      try {
        const result = await client.request('/projects/{projectId}/web-analytics/breakdown', {
          params: {
            dimension: params.dimension,
            metric: params.metric,
            preset: params.preset,
            from: params.from,
            to: params.to,
            timezone: params.timezone ?? 'UTC',
            ...filtersToParams(params.filters),
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

function filtersToParams(filters?: string[]): Record<string, string> {
  if (!filters || filters.length === 0) return {};
  const params: Record<string, string> = {};
  filters.forEach((f, i) => {
    params[`filters[${i}]`] = f;
  });
  return params;
}

import { describe, it, expect, vi } from 'vitest';
import { registerAllTools } from '../tools/index.js';
import { KitbaseApiClient } from '../client.js';
import { McpConfig } from '../config.js';

describe('Tool registrations', () => {
  function createMockServer() {
    const tools: Array<{ name: string; description: string; schema: unknown; handler: Function }> = [];
    return {
      tool: vi.fn((name: string, description: string, schema: unknown, handler: Function) => {
        tools.push({ name, description, schema, handler });
      }),
      tools,
    };
  }

  function createMockClient() {
    const config: McpConfig = {
      apiUrl: 'https://api.kitbase.io',
      apiKey: 'sk_kitbase_test123',
      projectId: 'proj_abc',
    };
    const client = new KitbaseApiClient(config);
    vi.spyOn(client, 'request').mockResolvedValue({ data: 'mock' });
    return client;
  }

  it('registers all 15 tools', () => {
    const server = createMockServer();
    const client = createMockClient();

    registerAllTools(server as any, client);

    expect(server.tool).toHaveBeenCalledTimes(15);

    const toolNames = server.tools.map((t) => t.name);
    expect(toolNames).toContain('get_web_summary');
    expect(toolNames).toContain('get_web_timeline');
    expect(toolNames).toContain('get_web_breakdown');
    expect(toolNames).toContain('compare_periods');
    expect(toolNames).toContain('list_events');
    expect(toolNames).toContain('get_event_stats');
    expect(toolNames).toContain('list_users');
    expect(toolNames).toContain('get_user_summary');
    expect(toolNames).toContain('get_user_activity');
    expect(toolNames).toContain('get_user_events');
    expect(toolNames).toContain('list_sessions');
    expect(toolNames).toContain('get_session_detail');
    expect(toolNames).toContain('analyze_funnel');
    expect(toolNames).toContain('analyze_journeys');
    expect(toolNames).toContain('get_frustration_report');
  });

  it('get_web_summary calls correct endpoint', async () => {
    const server = createMockServer();
    const client = createMockClient();

    registerAllTools(server as any, client);

    const tool = server.tools.find((t) => t.name === 'get_web_summary')!;
    const result = await tool.handler({ preset: 'last_7_days' });

    expect(client.request).toHaveBeenCalledWith('/projects/{projectId}/web-analytics', {
      params: expect.objectContaining({ preset: 'last_7_days', timezone: 'UTC' }),
    });
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual({ data: 'mock' });
  });

  it('list_events calls correct endpoint with params', async () => {
    const server = createMockServer();
    const client = createMockClient();

    registerAllTools(server as any, client);

    const tool = server.tools.find((t) => t.name === 'list_events')!;
    await tool.handler({ eventName: 'page_view', page: 0, size: 10 });

    expect(client.request).toHaveBeenCalledWith('/projects/{projectId}/events', {
      params: expect.objectContaining({
        eventName: 'page_view',
        page: 0,
        size: 10,
        timezone: 'UTC',
      }),
    });
  });

  it('analyze_funnel sends POST with body', async () => {
    const server = createMockServer();
    const client = createMockClient();

    registerAllTools(server as any, client);

    const tool = server.tools.find((t) => t.name === 'analyze_funnel')!;
    const steps = [{ eventName: 'page_view' }, { eventName: 'sign_up' }];
    await tool.handler({ steps, preset: 'last_30_days' });

    expect(client.request).toHaveBeenCalledWith('/projects/{projectId}/funnels/analyze', {
      method: 'POST',
      body: {
        steps,
        preset: 'last_30_days',
        from: undefined,
        to: undefined,
        timezone: 'UTC',
      },
    });
  });

  it('tool handler returns error response on failure', async () => {
    const server = createMockServer();
    const client = createMockClient();
    vi.spyOn(client, 'request').mockRejectedValue(new Error('Network error'));

    registerAllTools(server as any, client);

    const tool = server.tools.find((t) => t.name === 'get_web_summary')!;
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Network error');
  });

  it('get_session_detail calls both session and events endpoints', async () => {
    const server = createMockServer();
    const client = createMockClient();

    registerAllTools(server as any, client);

    const tool = server.tools.find((t) => t.name === 'get_session_detail')!;
    await tool.handler({ sessionId: 'sess_123' });

    expect(client.request).toHaveBeenCalledWith('/projects/{projectId}/sessions/sess_123');
    expect(client.request).toHaveBeenCalledWith('/projects/{projectId}/sessions/sess_123/events');
  });
});

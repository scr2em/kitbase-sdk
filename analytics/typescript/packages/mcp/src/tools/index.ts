import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { KitbaseApiClient } from '../client.js';
import { registerWebAnalyticsTools } from './web-analytics.js';
import { registerEventsTools } from './events.js';
import { registerUsersTools } from './users.js';
import { registerSessionsTools } from './sessions.js';
import { registerFunnelsTools } from './funnels.js';
import { registerJourneysTools } from './journeys.js';
import { registerFrustrationTools } from './frustration.js';

export function registerAllTools(server: McpServer, client: KitbaseApiClient): void {
  registerWebAnalyticsTools(server, client);
  registerEventsTools(server, client);
  registerUsersTools(server, client);
  registerSessionsTools(server, client);
  registerFunnelsTools(server, client);
  registerJourneysTools(server, client);
  registerFrustrationTools(server, client);
}

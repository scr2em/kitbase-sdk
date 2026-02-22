export interface McpConfig {
  apiUrl: string;
  apiKey: string;
  projectId: string;
  environmentId?: string;
}

export interface McpEnv {
  apiUrl: string;
  apiKey: string;
}

const DEFAULT_API_URL = 'https://api.kitbase.dev';

export function loadEnv(): McpEnv {
  const apiUrl = process.env.KITBASE_API_URL || DEFAULT_API_URL;
  const apiKey = process.env.KITBASE_API_KEY;

  if (!apiKey) throw new Error('KITBASE_API_KEY environment variable is required');

  if (!apiKey.startsWith('sk_kitbase_')) {
    throw new Error('KITBASE_API_KEY must be a private API key starting with sk_kitbase_');
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''), // strip trailing slash
    apiKey,
  };
}

export async function resolveConfig(env: McpEnv): Promise<McpConfig> {
  const response = await fetch(`${env.apiUrl}/api/v1/auth/key-info`, {
    headers: {
      'X-API-Key': env.apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Invalid or expired API key.\n\n' +
        'Please check:\n' +
        '  1. Your KITBASE_API_KEY is correct and starts with sk_kitbase_\n' +
        '  2. The key has not been revoked in the Kitbase dashboard\n' +
        '  3. KITBASE_API_URL points to the right environment',
      );
    }
    throw new Error(`Failed to resolve API key info (${response.status}): ${text || response.statusText}`);
  }

  const keyInfo = (await response.json()) as { projectId: string; environmentId?: string };

  return {
    apiUrl: env.apiUrl,
    apiKey: env.apiKey,
    projectId: keyInfo.projectId,
    environmentId: keyInfo.environmentId || undefined,
  };
}

import { ApiError } from './client.js';

export function formatToolError(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  let message: string;

  if (error instanceof ApiError) {
    const requestLine = `${error.method} ${error.url}`;
    let hint: string;

    switch (error.status) {
      case 401:
      case 403:
        hint = 'Authentication failed. Please check that your KITBASE_API_KEY is correct, has not been revoked, and that KITBASE_API_URL points to the right environment.';
        break;
      case 404:
        hint = 'Resource not found. Check that the requested ID exists.';
        break;
      case 429:
        hint = 'Rate limit exceeded. Please wait before retrying.';
        break;
      default:
        hint = error.body;
    }

    message = `${hint}\n\nRequest: ${requestLine}\nResponse: ${error.status} ${error.body}`;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

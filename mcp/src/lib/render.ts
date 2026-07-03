// Helpers for shaping MCP tool responses. Analytics payloads are structured
// numbers, so we return them as compact JSON in a single text block — lossless
// and cheap on tokens; Claude reformats JSON fine. Errors use `errorResult`
// (not `throw`) so the failure is shown to Claude verbatim and it can retry.

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** Wrap a value as a successful tool result: compact JSON in one text block. */
export function jsonResult(data: unknown): CallToolResult {
	return { content: [{ type: "text", text: JSON.stringify(data ?? null) }] };
}

/** Wrap a string as a plain-text successful result. */
export function textResult(text: string): CallToolResult {
	return { content: [{ type: "text", text }] };
}

/** Wrap a message as a recoverable error result. */
export function errorResult(message: string): CallToolResult {
	return { isError: true, content: [{ type: "text", text: message }] };
}

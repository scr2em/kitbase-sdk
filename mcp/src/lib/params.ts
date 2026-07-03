import { z } from "zod";

// Shared zod fragments spread into tool inputSchemas so every tool speaks the
// same param language. Field names match the Kitbase API query params exactly
// (the openapi-fetch call is type-checked against the generated spec, so a
// wrong name fails the build).

export const DATE_RANGE_PRESETS = [
	"last_30_minutes",
	"last_hour",
	"today",
	"yesterday",
	"last_7_days",
	"last_30_days",
	"this_month",
	"this_year",
] as const;

export const orgSlug = z
	.string()
	.describe("Organization slug. Get it from list_orgs_and_projects.");

export const projectId = z
	.string()
	.describe("Project ID. Get it from list_orgs_and_projects.");

export const preset = z
	.enum(DATE_RANGE_PRESETS)
	.optional()
	.describe("Predefined date range. When set, overrides from/to. e.g. 'last_7_days'.");

export const from = z
	.string()
	.optional()
	.describe("Start date (inclusive, YYYY-MM-DD). Ignored when preset is set.");

export const to = z
	.string()
	.optional()
	.describe("End date (inclusive, YYYY-MM-DD). Ignored when preset is set.");

export const timezone = z
	.string()
	.default("UTC")
	.describe("IANA timezone (e.g. 'America/New_York') used to resolve date boundaries. Defaults to UTC.");

export const page = z
	.number()
	.int()
	.min(0)
	.default(0)
	.describe("Page number (0-indexed).");

export const size = z
	.number()
	.int()
	.min(1)
	.max(100)
	.default(20)
	.describe("Items per page (1-100).");

export const filters = z
	.array(z.string())
	.optional()
	.describe(
		'Dimension filters, each "dimension:operator:values" where operator is "is" or "is_not" and ' +
			'values are comma-separated. e.g. ["country:is:US,UK", "browser:is_not:Safari"].',
	);

// The web/event analytics breakdown dimensions the API accepts.
export const BREAKDOWN_DIMENSIONS = [
	"device",
	"browser",
	"browser_version",
	"os",
	"os_version",
	"brand",
	"model",
	"country",
	"region",
	"city",
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"path",
	"entry_page",
	"exit_page",
	"top_page",
	"referrer",
	"top_referrer",
	"outbound_link",
	"custom_events",
] as const;

// AI provider filter shared across ai-visibility tools.
export const AI_PROVIDERS = ["PERPLEXITY", "GEMINI", "CLAUDE", "CHATGPT", "ALL"] as const;

export const aiProvider = z
	.enum(AI_PROVIDERS)
	.optional()
	.describe("AI provider filter. 'ALL' (default) aggregates across providers.");

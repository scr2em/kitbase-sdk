// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class BotsAnalyticsTopPaths extends ApiOperationCommand {
	static description = "Get top paths scraped by bots/crawlers";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"size": Flags.integer({ description: "Maximum number of top paths to return" }),
		"vendor": Flags.string({ description: "Restrict to one bot vendor/company (e.g. \"OpenAI\", \"Anthropic\", \"Google\", \"Perplexity\")" }),
		"comparePreset": Flags.string({ description: "Which earlier period the selected one is compared against. Takes precedence over compareFrom/compareTo. Omitting all three comparison parameters compares against the previous period — the same length, immediately before the selected window. There is no way to ask for no comparison.\n", options: ["previous_period","previous_week","previous_month","previous_quarter","previous_year"] }),
		"compareFrom": Flags.string({ description: "Start date of a custom comparison window (inclusive, YYYY-MM-DD), resolved in the project's reporting timezone. Must be sent together with compareTo, and is ignored when comparePreset is present. Unlike the presets, its length may differ from the selected period's. Omitted, the report compares against the previous period.\n" }),
		"compareTo": Flags.string({ description: "End date of a custom comparison window (inclusive, YYYY-MM-DD). Must be sent together with compareFrom. Omitted, the report compares against the previous period.\n" }),
	};

	descriptor = descriptors["getBotsAnalyticsTopPaths"];
}

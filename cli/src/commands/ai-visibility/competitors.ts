// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AiVisibilityCompetitors extends ApiOperationCommand {
	static description = "Competitors leaderboard";
	static flags = {
		"jobs": Flags.integer({ description: "Number of most recent completed jobs to aggregate (ignored when from/to set)" }),
		"limit": Flags.integer({ description: "Maximum number of brands to return" }),
		"providers": Flags.string({ description: "AI engines to include. Repeat the parameter to select several; omitted or empty aggregates across every engine. There is no 'ALL' sentinel — an empty selection is what \"all engines\" means.\n", options: ["PERPLEXITY","GEMINI","CLAUDE","CHATGPT","DEEPSEEK","GLM","KIMI","GOOGLE_AI_OVERVIEW","GOOGLE_AI_MODE","CHATGPT_WEB","GEMINI_WEB"], multiple: true }),
		"preset": Flags.string({ description: "Predefined date range preset. Takes precedence over from/to.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start of the date window (inclusive, interpreted in the project's reporting timezone). When a preset or a date window is given, jobs finishing inside it are aggregated instead of the last-N-jobs window.\n" }),
		"to": Flags.string({ description: "End of the date window (inclusive, interpreted in the project's reporting timezone)." }),
		"topicIds": Flags.string({ description: "Topic UUIDs to include, plus the reserved literal `uncategorized` for runs with no topic. Repeat the parameter to select several; omitted or empty means all topics.\n", multiple: true }),
		"regions": Flags.string({ description: "Regions to include. Repeat the parameter to select several; omitted or empty aggregates across every region the project runs. A region the organization is not entitled to is rejected.\n", options: ["US","EU"], multiple: true }),
		"comparePreset": Flags.string({ description: "Which earlier period the selected one is compared against. Takes precedence over compareFrom/compareTo. Omitting all three comparison parameters compares against the previous period — the same length, immediately before the selected window. There is no way to ask for no comparison.\n", options: ["previous_period","previous_week","previous_month","previous_quarter","previous_year"] }),
		"compareFrom": Flags.string({ description: "Start date of a custom comparison window (inclusive, YYYY-MM-DD), resolved in the project's reporting timezone. Must be sent together with compareTo, and is ignored when comparePreset is present. Unlike the presets, its length may differ from the selected period's. Omitted, the report compares against the previous period.\n" }),
		"compareTo": Flags.string({ description: "End date of a custom comparison window (inclusive, YYYY-MM-DD). Must be sent together with compareFrom. Omitted, the report compares against the previous period.\n" }),
	};

	descriptor = descriptors["getAiVisibilityCompetitors"];
}

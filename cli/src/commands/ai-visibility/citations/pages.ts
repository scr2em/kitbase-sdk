// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityCitationsPages extends ApiOperationCommand {
	static description = "Cited pages";
	static flags = {
		"providers": Flags.string({ description: "AI engines to include. Repeat the parameter to select several; omitted or empty aggregates across every engine. There is no 'ALL' sentinel — an empty selection is what \"all engines\" means.\n", options: ["PERPLEXITY","GEMINI","CLAUDE","CHATGPT","DEEPSEEK","GLM","KIMI","GOOGLE_AI_OVERVIEW","GOOGLE_AI_MODE","CHATGPT_WEB","GEMINI_WEB"], multiple: true }),
		"mentioningBrand": Flags.boolean({ description: "When true, only count citations from answers where the project's own brand appeared" }),
		"jobs": Flags.integer({ description: "Number of most recent completed jobs to aggregate (ignored when from/to set)" }),
		"page": Flags.integer({ description: "Zero-based page index of the URL list" }),
		"size": Flags.integer({ description: "Page size of the URL list" }),
		"preset": Flags.string({ description: "Predefined date range preset. Takes precedence over from/to.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start of the date window (inclusive, interpreted in the project's reporting timezone). When a preset or a date window is given, jobs finishing inside it are aggregated instead of the last-N-jobs window.\n" }),
		"to": Flags.string({ description: "End of the date window (inclusive, interpreted in the project's reporting timezone)." }),
		"topicIds": Flags.string({ description: "Topic UUIDs to include, plus the reserved literal `uncategorized` for runs with no topic. Repeat the parameter to select several; omitted or empty means all topics.\n", multiple: true }),
		"regions": Flags.string({ description: "Regions to include. Repeat the parameter to select several; omitted or empty aggregates across every region the project runs. A region the organization is not entitled to is rejected.\n", options: ["US","EU"], multiple: true }),
	};

	descriptor = descriptors["getAiVisibilityCitedPages"];
}

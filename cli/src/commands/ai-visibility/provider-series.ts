// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AiVisibilityProviderSeries extends ApiOperationCommand {
	static description = "Per-provider presence time series";
	static flags = {
		"limit": Flags.integer({ description: "Maximum number of most recent jobs to include (ignored when from/to set)" }),
		"preset": Flags.string({ description: "Predefined date range preset. Takes precedence over from/to.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start of the date window (inclusive, interpreted in the client timezone). When a preset or a date window is given, jobs finishing inside it are aggregated instead of the last-N-jobs window.\n" }),
		"to": Flags.string({ description: "End of the date window (inclusive, interpreted in the client timezone)." }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\") used to resolve preset/date boundaries; defaults to UTC." }),
		"topicIds": Flags.string({ description: "Topic UUIDs to include, plus the reserved literal `uncategorized` for runs with no topic. Repeat the parameter to select several; omitted or empty means all topics.\n", multiple: true }),
		"providers": Flags.string({ description: "AI engines to include. Repeat the parameter to select several; omitted or empty aggregates across every engine. There is no 'ALL' sentinel — an empty selection is what \"all engines\" means.\n", options: ["PERPLEXITY","GEMINI","CLAUDE","CHATGPT","DEEPSEEK","GLM","KIMI","GOOGLE_AI_OVERVIEW","GOOGLE_AI_MODE","CHATGPT_WEB","GEMINI_WEB"], multiple: true }),
	};

	descriptor = descriptors["getAiVisibilityProviderSeries"];
}

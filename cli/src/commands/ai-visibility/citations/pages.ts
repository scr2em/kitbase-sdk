// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityCitationsPages extends ApiOperationCommand {
	static description = "Cited pages";
	static flags = {
		"provider": Flags.string({ description: "AI provider filter ('ALL' aggregates across providers)", options: ["PERPLEXITY","GEMINI","CLAUDE","CHATGPT","ALL"] }),
		"mentioningBrand": Flags.boolean({ description: "When true, only count citations from answers where the project's own brand appeared" }),
		"jobs": Flags.integer({ description: "Number of most recent completed jobs to aggregate (ignored when from/to set)" }),
		"page": Flags.integer({ description: "Zero-based page index of the URL list" }),
		"size": Flags.integer({ description: "Page size of the URL list" }),
		"preset": Flags.string({ description: "Predefined date range preset. Takes precedence over from/to.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start of the date window (inclusive, interpreted in the client timezone). When a preset or a date window is given, jobs finishing inside it are aggregated instead of the last-N-jobs window.\n" }),
		"to": Flags.string({ description: "End of the date window (inclusive, interpreted in the client timezone)." }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\") used to resolve preset/date boundaries; defaults to UTC." }),
	};

	descriptor = descriptors["getAiVisibilityCitedPages"];
}

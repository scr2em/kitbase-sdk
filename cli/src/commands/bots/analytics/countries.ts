// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class BotsAnalyticsCountries extends ApiOperationCommand {
	static description = "Get per-country bot/crawler breakdown";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\"). Used to convert date boundaries to UTC." }),
		"page": Flags.integer({ description: "Zero-based page number" }),
		"size": Flags.integer({ description: "Items per page" }),
	};

	descriptor = descriptors["getBotsAnalyticsCountries"];
}

// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class BotsAnalyticsTimeline extends ApiOperationCommand {
	static description = "Get bot/crawler timeline by vendor";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"interval": Flags.string({ description: "Time-bucketing granularity for the timeline data. Defaults to day.", options: ["minute","hour","day"] }),
	};

	descriptor = descriptors["getBotsAnalyticsTimeline"];
}

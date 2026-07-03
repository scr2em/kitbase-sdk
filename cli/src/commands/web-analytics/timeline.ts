// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class WebAnalyticsTimeline extends ApiOperationCommand {
	static description = "Get project web analytics timeline data";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date for the analytics period (inclusive, YYYY-MM-DD). Used when preset is not provided. Defaults to today." }),
		"to": Flags.string({ description: "End date for the analytics period (inclusive, YYYY-MM-DD). Used when preset is not provided. Defaults to today." }),
		"interval": Flags.string({ description: "Time-bucketing granularity for the timeline data. Defaults to hour.", options: ["minute","hour","day"] }),
		"filters": Flags.string({ description: "Dimension filters in format dimension:operator:values.\nOperator is 'is' (include) or 'is_not' (exclude).\nValues are comma-separated. Can specify multiple filters.\nExample: filters=country:is:US,UK&filters=browser:is_not:Safari\n" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC.", required: true }),
	};

	descriptor = descriptors["getProjectWebAnalyticsTimeline"];
}

// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AnalyticsUsers extends ApiOperationCommand {
	static description = "List users from analytics";
	static flags = {
		"type": Flags.string({ description: "Filter by user identification type", options: ["all","identified","anonymous"] }),
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC. Defaults to UTC if omitted." }),
		"page": Flags.integer({ description: "Page number (0-indexed)" }),
		"size": Flags.integer({ description: "Page size" }),
		"search": Flags.string({ description: "Search by user_id or anonymous_id (partial match)" }),
		"filters": Flags.string({ description: "Dimension filters in format dimension:operator:values.\nOperator is 'is' (include) or 'is_not' (exclude).\nValues are comma-separated. Can specify multiple filters.\nExample: filters=country:is:US,UK&filters=browser:is_not:Safari\n", multiple: true }),
	};

	descriptor = descriptors["listAnalyticsUsers"];
}

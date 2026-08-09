// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class EventsList extends ApiOperationCommand {
	static description = "List custom events";
	static flags = {
		"event": Flags.string({ description: "Filter by event name" }),
		"channel": Flags.string({ description: "Filter by channel" }),
		"user_id": Flags.string({ description: "Filter by user ID" }),
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start of time range" }),
		"to": Flags.string({ description: "End of time range" }),
		"page": Flags.integer({ description: "Page number" }),
		"size": Flags.integer({ description: "Page size" }),
		"sort": Flags.string({ description: "Sort order by timestamp", options: ["asc","desc"] }),
		"filters": Flags.string({ description: "Dimension filters in format dimension:operator:values.\nOperator is 'is' (include) or 'is_not' (exclude).\nValues are comma-separated. Can specify multiple filters.\nExample: filters=country:is:US,UK&filters=browser:is_not:Safari\n", multiple: true }),
	};

	descriptor = descriptors["listEvents"];
}

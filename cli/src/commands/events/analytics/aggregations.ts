// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class EventsAnalyticsAggregations extends ApiOperationCommand {
	static description = "Get aggregated unique events";
	static flags = {
		"channel": Flags.string({ description: "Filter by channel" }),
		"search": Flags.string({ description: "Case-insensitive substring filter on event name" }),
		"user_id": Flags.string({ description: "Case-insensitive substring filter on the resolved user (user_id / anonymous_id). Scopes every aggregation to events from matching users." }),
		"preset": Flags.string({ description: "Predefined date range preset. Takes precedence over from/to.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC.", required: true }),
		"page": Flags.integer({ description: "Page number (0-indexed)" }),
		"size": Flags.integer({ description: "Number of items per page" }),
		"sort": Flags.string({ description: "Sort direction by event count", options: ["asc","desc"] }),
	};

	descriptor = descriptors["getEventsAnalyticsAggregations"];
}

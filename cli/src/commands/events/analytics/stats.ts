// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class EventsAnalyticsStats extends ApiOperationCommand {
	static description = "Get aggregated event statistics";
	static flags = {
		"group_by": Flags.string({ description: "Group statistics by event name or user", options: ["event","user"] }),
		"channel": Flags.string({ description: "Filter by channel" }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC.", required: true }),
	};

	descriptor = descriptors["getEventsAnalyticsStats"];
}

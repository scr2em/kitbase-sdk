// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class EventsAnalyticsTimeline extends ApiOperationCommand {
	static description = "Get events timeline";
	static flags = {
		"interval": Flags.string({ description: "Time interval for grouping data", options: ["hour","day","week","month"] }),
		"event": Flags.string({ description: "Filter by specific event name" }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC.", required: true }),
	};

	descriptor = descriptors["getEventsAnalyticsTimeline"];
}

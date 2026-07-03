// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class EventsUsersGet extends ApiOperationCommand {
	static description = "List events by user ID";
	static args = {
		"userId": Args.string({ description: "User ID to filter events by", required: true }),
	};
	static flags = {
		"event": Flags.string({ description: "Filter by event name (partial match)" }),
		"from": Flags.string({ description: "Start of time range" }),
		"to": Flags.string({ description: "End of time range" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC.", required: true }),
		"page": Flags.integer({ description: "Page number" }),
		"size": Flags.integer({ description: "Page size" }),
		"sort": Flags.string({ description: "Sort order by timestamp", options: ["asc","desc"] }),
	};

	descriptor = descriptors["listEventsByUserId"];
}

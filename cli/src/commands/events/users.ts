// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class EventsUsers extends ApiOperationCommand {
	static description = "List unique event users";
	static flags = {
		"search": Flags.string({ description: "Search by user ID (partial match)" }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"page": Flags.integer({ description: "Page number" }),
		"size": Flags.integer({ description: "Page size" }),
		"sort": Flags.string({ description: "Sort order by last seen timestamp", options: ["asc","desc"] }),
	};

	descriptor = descriptors["listEventUsers"];
}

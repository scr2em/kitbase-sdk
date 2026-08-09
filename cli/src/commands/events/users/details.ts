// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class EventsUsersDetails extends ApiOperationCommand {
	static description = "Get event user details";
	static args = {
		"userId": Args.string({ description: "User ID to get details for", required: true }),
	};
	static flags = {
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
	};

	descriptor = descriptors["getEventUserDetails"];
}

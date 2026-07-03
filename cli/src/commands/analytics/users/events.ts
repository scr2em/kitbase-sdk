// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AnalyticsUsersEvents extends ApiOperationCommand {
	static description = "List user events";
	static args = {
		"userId": Args.string({ description: "Resolved user ID", required: true }),
	};
	static flags = {
		"page": Flags.integer({ description: "Page number (0-indexed)" }),
		"size": Flags.integer({ description: "Page size" }),
	};

	descriptor = descriptors["getAnalyticsUserEvents"];
}

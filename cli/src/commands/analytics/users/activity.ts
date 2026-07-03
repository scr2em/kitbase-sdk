// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AnalyticsUsersActivity extends ApiOperationCommand {
	static description = "Get user activity heatmap";
	static args = {
		"userId": Args.string({ description: "Resolved user ID", required: true }),
	};
	static flags = {
		"months": Flags.integer({ description: "Number of months of activity to return" }),
	};

	descriptor = descriptors["getAnalyticsUserActivity"];
}

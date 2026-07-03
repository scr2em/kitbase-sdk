// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AnalyticsUsersSummary extends ApiOperationCommand {
	static description = "Get user analytics summary";
	static args = {
		"userId": Args.string({ description: "Resolved user ID", required: true }),
	};

	descriptor = descriptors["getAnalyticsUserSummary"];
}

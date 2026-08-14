// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsImpact extends ApiOperationCommand {
	static description = "What one action moved";
	static args = {
		"actionId": Args.string({ description: "actionId", required: true }),
	};
	static flags = {
		"windowDays": Flags.integer({ description: "Days on each side of the start date. Defaults to 21, max 90." }),
	};

	descriptor = descriptors["getTrackableActionImpact"];
}

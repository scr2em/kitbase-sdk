// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsGet extends ApiOperationCommand {
	static description = "Get one trackable action";
	static args = {
		"actionId": Args.string({ description: "actionId", required: true }),
	};

	descriptor = descriptors["getTrackableAction"];
}

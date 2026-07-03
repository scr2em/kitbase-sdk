// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InAppMessagesGet extends ApiOperationCommand {
	static description = "Get in-app message";
	static args = {
		"messageId": Args.string({ description: "messageId", required: true }),
	};

	descriptor = descriptors["getInAppMessage"];
}

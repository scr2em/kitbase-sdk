// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class InAppMessagesViewsClear extends ApiOperationCommand {
	static description = "Clear all views for a message";
	static args = {
		"messageId": Args.string({ description: "messageId", required: true }),
	};

	descriptor = descriptors["clearInAppMessageViews"];
}

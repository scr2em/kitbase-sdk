// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class InAppMessagesViewsDelete extends ApiOperationCommand {
	static description = "Delete a single message view";
	static args = {
		"messageId": Args.string({ description: "messageId", required: true }),
		"viewId": Args.string({ description: "viewId", required: true }),
	};

	descriptor = descriptors["deleteInAppMessageView"];
}

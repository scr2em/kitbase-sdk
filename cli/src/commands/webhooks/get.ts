// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class WebhooksGet extends ApiOperationCommand {
	static description = "Get webhook details";
	static args = {
		"webhookId": Args.string({ description: "Webhook ID", required: true }),
	};

	descriptor = descriptors["getWebhook"];
}

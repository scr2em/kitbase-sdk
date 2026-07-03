// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class WebhooksTest extends ApiOperationCommand {
	static description = "Test a webhook";
	static args = {
		"webhookId": Args.string({ description: "Webhook ID", required: true }),
	};

	descriptor = descriptors["testWebhook"];
}

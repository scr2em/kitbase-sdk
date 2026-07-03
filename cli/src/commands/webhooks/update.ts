// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class WebhooksUpdate extends ApiOperationCommand {
	static description = "Update webhook";
	static args = {
		"webhookId": Args.string({ description: "Webhook ID", required: true }),
	};
	static flags = {
		"name": Flags.string({ description: "Human-readable name for the webhook" }),
		"url": Flags.string({ description: "The URL to send webhook payloads to" }),
		"secret": Flags.string({ description: "Secret for HMAC signature verification (send empty string to clear)" }),
		"enabled": Flags.boolean({ description: "Whether the webhook is enabled" }),
	};

	descriptor = descriptors["updateWebhook"];
}

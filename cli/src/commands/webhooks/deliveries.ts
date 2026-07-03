// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class WebhooksDeliveries extends ApiOperationCommand {
	static description = "List webhook deliveries";
	static args = {
		"webhookId": Args.string({ description: "Webhook ID", required: true }),
	};
	static flags = {
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
		"success": Flags.boolean({ description: "Filter by success status" }),
	};

	descriptor = descriptors["listWebhookDeliveries"];
}

// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class IntegrationsSubscriptionsDeliveries extends ApiOperationCommand {
	static description = "List subscription deliveries";
	static args = {
		"provider": Args.string({ description: "provider", required: true }),
		"subscriptionId": Args.string({ description: "subscriptionId", required: true }),
	};
	static flags = {
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
	};

	descriptor = descriptors["listSubscriptionDeliveries"];
}

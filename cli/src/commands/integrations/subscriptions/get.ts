// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class IntegrationsSubscriptionsGet extends ApiOperationCommand {
	static description = "Get subscription details";
	static args = {
		"provider": Args.string({ description: "provider", required: true }),
		"subscriptionId": Args.string({ description: "subscriptionId", required: true }),
	};

	descriptor = descriptors["getIntegrationSubscription"];
}

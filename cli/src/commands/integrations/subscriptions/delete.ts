// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class IntegrationsSubscriptionsDelete extends ApiOperationCommand {
	static description = "Delete subscription";
	static args = {
		"provider": Args.string({ description: "provider", required: true }),
		"subscriptionId": Args.string({ description: "subscriptionId", required: true }),
	};

	descriptor = descriptors["deleteIntegrationSubscription"];
}

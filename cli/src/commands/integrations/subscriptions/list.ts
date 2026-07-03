// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class IntegrationsSubscriptionsList extends ApiOperationCommand {
	static description = "List subscriptions for a project";
	static args = {
		"provider": Args.string({ description: "provider", required: true }),
	};
	static flags = {
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
	};

	descriptor = descriptors["listProjectIntegrationSubscriptions"];
}

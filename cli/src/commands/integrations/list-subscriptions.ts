// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class IntegrationsListSubscriptions extends ApiOperationCommand {
	static description = "List all subscriptions for an integration";
	static args = {
		"provider": Args.string({ description: "provider", required: true }),
	};
	static flags = {
		"projectId": Flags.string({ description: "Filter by project ID" }),
		"featureType": Flags.string({ description: "Filter by feature type", options: ["custom_events","feature_flags","ota_updates","builds"] }),
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
	};

	descriptor = descriptors["listIntegrationSubscriptions"];
}

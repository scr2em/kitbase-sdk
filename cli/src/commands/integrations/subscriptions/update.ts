// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class IntegrationsSubscriptionsUpdate extends ApiOperationCommand {
	static description = "Update subscription";
	static args = {
		"provider": Args.string({ description: "provider", required: true }),
		"subscriptionId": Args.string({ description: "subscriptionId", required: true }),
	};
	static flags = {
		"channelId": Flags.string({ description: "Slack channel ID" }),
		"channelName": Flags.string({ description: "Slack channel name" }),
		"enabled": Flags.boolean({ description: "Whether the subscription is active" }),
		"forceNotify": Flags.boolean({ description: "When true, sends notifications for ALL matching events regardless of notify flag" }),
	};

	descriptor = descriptors["updateIntegrationSubscription"];
}

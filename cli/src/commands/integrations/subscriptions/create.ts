// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class IntegrationsSubscriptionsCreate extends ApiOperationCommand {
	static description = "Create integration subscription";
	static args = {
		"provider": Args.string({ description: "provider", required: true }),
	};
	static flags = {
		"featureType": Flags.string({ description: "Feature types that can trigger integration notifications", options: ["custom_events","feature_flags","ota_updates","builds"] }),
		"channelId": Flags.string({ description: "Slack channel ID" }),
		"channelName": Flags.string({ description: "Slack channel name (for display)" }),
		"enabled": Flags.boolean({ description: "Whether the subscription is active" }),
		"forceNotify": Flags.boolean({ description: "When true, sends notifications for ALL matching events regardless of notify flag in the event request" }),
	};

	descriptor = descriptors["createIntegrationSubscription"];
}

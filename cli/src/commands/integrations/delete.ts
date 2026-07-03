// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class IntegrationsDelete extends ApiOperationCommand {
	static description = "Disconnect integration";
	static args = {
		"provider": Args.string({ description: "Integration provider", required: true }),
	};

	descriptor = descriptors["disconnectIntegration"];
}

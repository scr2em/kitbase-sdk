// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class IntegrationsGet extends ApiOperationCommand {
	static description = "Get integration by provider";
	static args = {
		"provider": Args.string({ description: "Integration provider (e.g., slack)", required: true }),
	};

	descriptor = descriptors["getIntegration"];
}

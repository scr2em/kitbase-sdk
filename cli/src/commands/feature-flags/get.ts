// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagsGet extends ApiOperationCommand {
	static description = "Get feature flag details";
	static args = {
		"flagKey": Args.string({ description: "Feature flag key", required: true }),
	};

	descriptor = descriptors["getFeatureFlag"];
}

// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagsDelete extends ApiOperationCommand {
	static description = "Delete feature flag";
	static args = {
		"flagKey": Args.string({ description: "Feature flag key", required: true }),
	};
	static flags = {
		"deleteAllEnvironments": Flags.boolean({ description: "When true, delete the feature flag with the same key across all environments in the project." }),
	};

	descriptor = descriptors["deleteFeatureFlag"];
}

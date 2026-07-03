// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagsUpdate extends ApiOperationCommand {
	static description = "Update feature flag";
	static args = {
		"flagKey": Args.string({ description: "Feature flag key", required: true }),
	};
	static flags = {
		"name": Flags.string({ description: "Human-readable name for the flag" }),
		"description": Flags.string({ description: "Description of what this flag controls" }),
		"enabled": Flags.boolean({ description: "Whether the flag is enabled in this environment" }),
	};

	descriptor = descriptors["updateFeatureFlag"];
}

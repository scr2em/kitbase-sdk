// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagsCreate extends ApiOperationCommand {
	static description = "Create feature flag";
	static flags = {
		"flagKey": Flags.string({ description: "Unique key for the flag within the project (alphanumeric, underscores, hyphens)" }),
		"name": Flags.string({ description: "Human-readable name for the flag" }),
		"description": Flags.string({ description: "Description of what this flag controls" }),
		"valueType": Flags.string({ description: "The data type of the feature flag value", options: ["boolean","string","number","json"] }),
		"defaultEnabled": Flags.boolean({ description: "Default enabled state for this environment" }),
	};

	descriptor = descriptors["createFeatureFlag"];
}

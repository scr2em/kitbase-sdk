// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagsList extends ApiOperationCommand {
	static description = "List feature flags";
	static flags = {
		"page": Flags.integer({ description: "Page number (0-based)" }),
		"size": Flags.integer({ description: "Number of items per page" }),
		"sort": Flags.string({ description: "Sort direction by creation date", options: ["asc","desc"] }),
	};

	descriptor = descriptors["listFeatureFlags"];
}

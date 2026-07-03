// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagSegmentsList extends ApiOperationCommand {
	static description = "List feature flag segments";
	static flags = {
		"page": Flags.integer({ description: "Page number (0-based)" }),
		"size": Flags.integer({ description: "Number of items per page" }),
	};

	descriptor = descriptors["listFeatureFlagSegments"];
}

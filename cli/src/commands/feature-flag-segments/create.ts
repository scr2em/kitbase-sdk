// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagSegmentsCreate extends ApiOperationCommand {
	static description = "Create feature flag segment";
	static flags = {
		"name": Flags.string({ description: "Name of the segment" }),
		"description": Flags.string({ description: "Description of this segment" }),
	};

	descriptor = descriptors["createFeatureFlagSegment"];
}

// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagSegmentsUpdate extends ApiOperationCommand {
	static description = "Update feature flag segment";
	static args = {
		"segmentId": Args.string({ description: "Segment ID (UUID)", required: true }),
	};
	static flags = {
		"name": Flags.string({ description: "Name of the segment" }),
		"description": Flags.string({ description: "Description of this segment" }),
	};

	descriptor = descriptors["updateFeatureFlagSegment"];
}

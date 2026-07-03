// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagSegmentsGet extends ApiOperationCommand {
	static description = "Get feature flag segment";
	static args = {
		"segmentId": Args.string({ description: "Segment ID (UUID)", required: true }),
	};

	descriptor = descriptors["getFeatureFlagSegment"];
}

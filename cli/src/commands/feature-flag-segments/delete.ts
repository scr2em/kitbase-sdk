// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeatureFlagSegmentsDelete extends ApiOperationCommand {
	static description = "Delete feature flag segment";
	static args = {
		"segmentId": Args.string({ description: "Segment ID (UUID)", required: true }),
	};

	descriptor = descriptors["deleteFeatureFlagSegment"];
}
